import * as grpc from '@grpc/grpc-js'
import * as pb from '../generated/hello_pb'
import { HelloClient } from '../generated/hello_grpc_pb'

const sleep = (n: number) => new Promise((r) => setTimeout(r, n))

const testEcho = async (c: HelloClient) => {
  const req = new pb.EchoRequest()
  req.setMessage('test')

  c.echo(req, (err, data) => {
    if (err) {
      console.log('err: ', err)
    } else {
      console.log(data.toObject())
    }
  })
}

const testStream = async (c: HelloClient) => {
  const req = new pb.EchoRequest()
  req.setMessage('test2')
  const st = c.serverStream(req)
  st.on('data', (d) => {
    console.log(d.toObject())
  })

  st.on('end', () => {
    console.log('done')
  })

  st.on('error', (err) => {
    console.log('error', err)
  })
}

const testClientStream = async (c: HelloClient) => {
  const call = c.clientStream((err, resp) => {
    if (err) {
      console.log(err)
    } else {
      console.log(resp)
    }
  })

  Array(5)
    .fill(null)
    .forEach((_, i) => {
      const req = new pb.EchoRequest()
      req.setMessage(`test ${i}`)
      call.write(req)
    })

  call.end()
}

const testDuplexStream = async (c: HelloClient) => {
  const call = c.duplexStream()
  call.on('data', (data) => {
    console.log(data.toObject())
  })

  call.on('end', () => {
    console.log('end')
  })

  for (let i = 0; i < 5; i++) {
    const req = new pb.EchoRequest()
    req.setMessage(`test ${i}`)
    call.write(req)
    await sleep(1000)
  }

  call.end()
}

const main = async () => {
  const c = new HelloClient('localhost:8080', grpc.credentials.createInsecure())

  await testEcho(c)
  // await testStream(c)
  // await testClientStream(c)
  // await testDuplexStream(c)
}

main()
