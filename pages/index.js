import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export default function Home() {
  const [saldo, setSaldo] = useState(0);
  const [saldoBTC, setSaldoBTC] = useState(0);
  const [positions, setPositions] = useState([]);
  const [btcPrice, setBtcPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastBtcUpdate, setLastBtcUpdate] = useState(Date.now());
  const [btcElapsed, setBtcElapsed] = useState(0);
  const SOCKET_URL = 'https://binancesocket.onrender.com';
  const API_URL = 'https://binancesocket.onrender.com';
  const totalBloqueado = saldo + (saldoBTC * btcPrice);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('saldo_atualizado', (data) => {
      setSaldo(data.saldo);
      setSaldoBTC(data.saldo_btc);
      setPositions(data.positions);
      setLoading(false);
    });
    socket.on('btc_price', (data) => {
      setBtcPrice(data.price);
      setLastBtcUpdate(Date.now());
      setBtcElapsed(0);
    });
    axios.get(`${API_URL}/saldo`).then(res => {
      setSaldo(res.data.saldo);
      setSaldoBTC(res.data.saldo_btc);
      setPositions(res.data.positions);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { socket.disconnect(); };
  }, []);

  // Atualiza o contador de segundos desde a última atualização do preço do BTC
  useEffect(() => {
    const interval = setInterval(() => {
      setBtcElapsed(Math.floor((Date.now() - lastBtcUpdate) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastBtcUpdate]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Binance Bot Dashboard</h1>
      {loading ? (
        <p>Carregando dados...</p>
      ) : (
        <>
          <p><strong>Saldo USD:</strong> ${saldo}</p>
          <p><strong>Saldo BTC:</strong> {saldoBTC} BTC</p>
          <p><strong>Preço BTC/USDT:</strong> ${btcPrice} <span style={{fontSize:12, color:'#888'}}>({btcElapsed}s desde última atualização)</span></p>
          <p><strong>Total bloqueado (USD):</strong> ${totalBloqueado.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          <h2>Posições</h2>
          <ul>
            {positions && positions.length > 0 ? (
              positions.map((pos, idx) => (
                typeof pos === 'object' && pos !== null ? (
                  <li key={idx}>
                    <div><strong>Quantidade:</strong> {pos.quantidade}</div>
                    <div><strong>Preço:</strong> ${pos.preco}</div>
                    <div><strong>Timestamp:</strong> {pos.timestamp ? new Date(pos.timestamp).toLocaleString('pt-BR') : '-'}</div>
                  </li>
                ) : <li key={idx}>{pos}</li>
              ))
            ) : (
              <li>Nenhuma posição aberta</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
