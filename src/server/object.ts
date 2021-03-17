import * as grpc from '@grpc/grpc-js'
import { IHelloServer, HelloService } from '../generated/hello_grpc_pb'

const helloServer: IHelloServer = {
  echo: (call, callback) => {
    console.log(call.request.toObject())
    callback(null, call.request)
  },
  serverStream: (call) => {
    console.log(call.request.toObject())
    Array(3)
      .fill(call.request)
      .map((r) => call.write(r))
    call.end()
  },
  clientStream: (call, callback) => {
    let d: any
    call.on('data', (dd) => {
      console.log(dd.toObject())
      d = dd
    })

    call.on('error', (err) => {
      callback(err)
    })

    call.on('end', () => {
      callback(null, d)
    })
  },
  duplexStream: (call) => {
    call.on('error', (err) => {
      call.emit('error', err)
    })

    call.on('end', () => {
      call.end()
    })

    call.on('data', (d) => {
      console.log(d.toObject())
      call.write(d)
    })
  },
}

const main = async () => {
  const server = new grpc.Server()
  server.addService(HelloService, helloServer)

  server.bindAsync(
    '0.0.0.0:8080',
    grpc.ServerCredentials.createInsecure(),
    () => {
      server.start()
    }
  )
}

main()
