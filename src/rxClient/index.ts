import { from, interval, of } from 'rxjs'
import { take, map, concatAll } from 'rxjs/operators'
import * as grpc from '@grpc/grpc-js'
import {
  promisifyUnaryCall,
  readStreamToObserver,
  observerToWriteStream,
} from '@zcong/ts-grpc-helper'
import * as pb from '../generated/hello_pb'
import { HelloClient } from '../generated/hello_grpc_pb'

const testEcho = async (c: HelloClient) => {
  const req = new pb.EchoRequest()
  req.setMessage('test')

  const cc = promisifyUnaryCall(c.echo, c)
  const resp = await cc(req)
  console.log(resp.res.toObject())
}

const testStream = async (c: HelloClient) => {
  const req = new pb.EchoRequest()
  req.setMessage('test2')
  const st = c.serverStream(req)
  const result$ = readStreamToObserver(st)
  await result$.forEach((data) => {
    console.log(data.toObject())
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

  observerToWriteStream(
    from(
      Array(5)
        .fill(null)
        .map((_, i) => {
          const req = new pb.EchoRequest()
          req.setMessage(`test ${i}`)
          return req
        })
    ),
    call
  )
}

const testDuplexStream = async (c: HelloClient) => {
  const call = c.duplexStream()

  const result$ = readStreamToObserver(call)
  result$.forEach((data) => {
    console.log(data.toObject())
  })

  const source$ = interval(1000).pipe(
    take(5),
    map((v) => {
      const req = new pb.EchoRequest()
      req.setMessage(`test ${v}`)
      return of(req)
    }),
    concatAll()
  )

  observerToWriteStream(source$, call)
}

const main = async () => {
  const c = new HelloClient('localhost:8080', grpc.credentials.createInsecure())

  await testEcho(c)
  await testStream(c)
  await testClientStream(c)
  await testDuplexStream(c)
}

main()
