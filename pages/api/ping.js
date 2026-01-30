//rota ping responde pong
// API simples de ping para teste
export default function handler(req, res) {
  res.status(200).json({ message: 'pong' });
}