import { Etcd3 } from 'etcd3'

const c = new Etcd3()

const watch = async () => {
  const w = await c.watch().prefix('test/').create()
  w.on('put', (kv) => {
    console.log('put', kv.key.toString(), kv.value.toString())
  })

  w.on('delete', (r) => {
    console.log('delete', r.key.toString())
  })
}

const main = async () => {
  watch()
  const l = c.lease(2, { autoKeepAlive: true })
  setTimeout(() => l.revoke(), 10000)
  await l.put('test/xxx').value('')
}

main()
