export default function handler(req, res) {
    console.log('Ping recebido');
    res.status(200).json({ message: 'pong' });
}