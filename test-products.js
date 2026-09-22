require('https').get('https://pepeleria-api.vercel.app/api/products', (r) => {
  let d = '';
  r.on('data', (c) => { d += c; });
  r.on('end', () => console.log(d.substring(0, 3000)));
});