import * as grpc from '@grpc/grpc-js'
import { HandleCall } from '@grpc/grpc-js/build/src/server-call'
import * as hello_pb from '../generated/hello_pb'
import { IHelloServer, HelloService } from '../generated/hello_grpc_pb'

export class BaseService implements grpc.UntypedServiceImplementation {
  [name: string]: HandleCall<any, any>
}

class HelloServer extends BaseService implements IHelloServer {
  echo(
    call: grpc.ServerUnaryCall<hello_pb.EchoRequest, hello_pb.EchoRequest>,
    callback: grpc.sendUnaryData<hello_pb.EchoRequest>
  ) {
    console.log(call.request.toObject())
    callback(null, call.request)
  }

  serverStream(
    call: grpc.ServerWritableStream<hello_pb.EchoRequest, hello_pb.EchoRequest>
  ) {
    console.log(call.request.toObject())
    Array(3)
      .fill(call.request)
      .map((r) => call.write(r))
    call.end()
  }

  clientStream(
    call: grpc.ServerReadableStream<hello_pb.EchoRequest, hello_pb.EchoRequest>,
    callback: grpc.sendUnaryData<hello_pb.EchoRequest>
  ) {
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
  }

  duplexStream(
    call: grpc.ServerDuplexStream<hello_pb.EchoRequest, hello_pb.EchoRequest>
  ) {
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
  }
}

const main = async () => {
  const server = new grpc.Server()
  server.addService(HelloService, new HelloServer())

  server.bindAsync(
    '0.0.0.0:8080',
    grpc.ServerCredentials.createInsecure(),
    () => {
      server.start()
    }
  )
}

main()
