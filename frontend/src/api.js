function method(verb) {
  return async (path, data) => {
    const res = await fetch(
      import.meta.env.BASE_URL + 'api/' + path, {
        method: verb,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    return res.json()
  }
}

export default {
  get: method('GET'),
  post: method('POST'),
  put: method('PUT'),
  delete: method('DELETE'),
}
