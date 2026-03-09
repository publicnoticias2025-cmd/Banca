import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('<h1>JS Server is UP!</h1>'));
app.listen(3000, '0.0.0.0', () => console.log('JS Server running on 3000'));
