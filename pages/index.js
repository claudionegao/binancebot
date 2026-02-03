import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = 'https://binancesocket.onrender.com';
const API_URL = 'https://binancesocket.onrender.com';

export default function Home() {
  const [saldo, setSaldo] = useState(0);
  const [saldoBTC, setSaldoBTC] = useState(0);
  const [positions, setPositions] = useState([]);
  const [btcPrice, setBtcPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastBtcUpdate, setLastBtcUpdate] = useState(Date.now());
  const [btcElapsed, setBtcElapsed] = useState(0);
  const [lastPrices, setLastPrices] = useState([]);

  const totalBloqueado = saldo + saldoBTC * btcPrice;

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('saldo_atualizado', (data) => {
      setSaldo(data.saldo);
      setSaldoBTC(data.saldo_btc);
      setPositions(data.positions || []);
      setLoading(false);
    });

    socket.on('btc_price', (data) => {
      setBtcPrice(data.price);
      setLastBtcUpdate(Date.now());
      setBtcElapsed(0);

      setLastPrices((prev) => {
        const last = prev[0]?.price;
        let direction = 'same';
        let diff = 0;

        if (last !== undefined) {
          diff = data.price - last;
          direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
        }

        const updated = [{ price: data.price, diff, direction }, ...prev];
        return updated.slice(0, 5);
      });
    });

    axios.get(`${API_URL}/saldo`).then((res) => {
      setSaldo(res.data.saldo);
      setSaldoBTC(res.data.saldo_btc);
      setPositions(res.data.positions || []);

      if (res.data.last_btc_price !== undefined) {
        setBtcPrice(res.data.last_btc_price);
        setLastBtcUpdate(Date.now());
        setLastPrices([{ price: res.data.last_btc_price, diff: 0, direction: 'same' }]);
      }

      setLoading(false);
    }).catch(() => setLoading(false));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBtcElapsed(Math.floor((Date.now() - lastBtcUpdate) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastBtcUpdate]);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Carregando dados...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Binance Bot Dashboard</h1>

      <p><strong>Saldo USD:</strong> ${Number(saldo || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      <p>
        <strong>Saldo BTC:</strong> {saldoBTC} BTC
        <span style={{ color: '#777', fontSize: '0.9em' }}>
          {' '}({(saldoBTC * btcPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD bloqueado)
        </span>
      </p>

      <p>
        <strong>Preço BTC/USDT:</strong> ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span style={{ color: '#777', fontSize: '0.9em' }}>
          {' '}({btcElapsed < 60 ? `${btcElapsed}s` : `${Math.floor(btcElapsed/60)}m ${btcElapsed%60}s`})
        </span>
      </p>

      <h2>Últimos preços</h2>
      <ul>
        {lastPrices.map((item, index) => {
          let arrow = '';
          let color = '#777';
          
          if (item.direction === 'up') {
            arrow = '🔼';
            color = 'green';
          } else if (item.direction === 'down') {
            arrow = '🔽';
            color = 'red';
          }
          
          return (
            <li key={index} style={{ color }}>
              {index + 1}. {arrow} {item.diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </li>
          );
        })}
      </ul>

      <p><strong>Total bloqueado (USD):</strong> ${totalBloqueado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

      <h2>Posições</h2>
      {positions.length === 0 && <p>Nenhuma posição aberta</p>}
      {positions.map((item, index) => (
        <div key={index} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, marginBottom: 10 }}>
          <p><strong>Quantidade:</strong> {item.quantidade}</p>
          <p><strong>Preço:</strong> ${item.preco}</p>
          <p><strong>Timestamp:</strong> {item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : '-'}</p>
        </div>
      ))}
    </div>
  );
}
