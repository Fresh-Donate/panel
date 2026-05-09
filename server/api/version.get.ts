import pkg from '../../package.json'

export default defineEventHandler(() => {
  return {
    name: 'FreshDonate Panel',
    version: pkg.version
  }
})
