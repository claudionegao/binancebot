import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
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
        return updated.slice(0, 10);
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
      <div style={{ 
        padding: '60px 20px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ color: '#333', fontSize: '24px' }}>Carregando dados...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1f2937', marginBottom: '30px' }}>📊 Binance Bot Dashboard</h1>

      {/* Cards de Saldos */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        {/* USD */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #0066cc'
        }}>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>💵 Saldo USD</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0066cc', margin: '0' }}>
            ${Number(saldo || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* BTC */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f7931a'
        }}>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>₿ Saldo BTC</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f7931a', margin: '0' }}>
            {Number(saldoBTC).toFixed(8)}
          </p>
          <p style={{ color: '#999', fontSize: '12px', margin: '8px 0 0 0' }}>
            ${(saldoBTC * btcPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </p>
        </div>

        {/* Preço BTC */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #00c853'
        }}>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>📈 Preço BTC/USDT</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#00c853', margin: '0' }}>
            ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p style={{ color: '#999', fontSize: '12px', margin: '8px 0 0 0' }}>
            Atualizado há {btcElapsed < 60 ? `${btcElapsed}s` : `${Math.floor(btcElapsed/60)}m ${btcElapsed%60}s`}
          </p>
        </div>

        {/* Total Bloqueado */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #d32f2f'
        }}>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>🔒 Total Bloqueado</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#d32f2f', margin: '0' }}>
            ${totalBloqueado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Últimos Preços */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#1f2937', marginTop: '0', marginBottom: '15px' }}>📉 Últimos 5 Preços</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {lastPrices.length === 0 ? (
            <p style={{ color: '#999' }}>Aguardando dados...</p>
          ) : (
            lastPrices.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#666' }}>#{index + 1}</span>
                {item.direction === 'up' && <FaArrowUp color="#00c853" size={18} />}
                {item.direction === 'down' && <FaArrowDown color="#d32f2f" size={18} />}
                {item.direction === 'same' && <span style={{ fontSize: '18px' }}>—</span>}
                <span style={{ 
                  fontWeight: 'bold',
                  color: item.direction === 'up' ? '#00c853' : item.direction === 'down' ? '#d32f2f' : '#666'
                }}>
                  ${item.diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Posições */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1f2937', marginTop: '0', marginBottom: '20px' }}>🎯 Posições Abertas ({positions.length})</h2>
        
        {positions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            color: '#999'
          }}>
            <p style={{ fontSize: '24px', margin: '0 0 10px 0' }}>📭</p>
            <p>Nenhuma posição aberta</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {positions.map((item, index) => (
              <div key={index} style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#fafafa',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #e0e0e0'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Posição #{index + 1}
                  </span>
                </div>
                
                <p style={{ margin: '8px 0', color: '#333' }}>
                  <strong style={{ color: '#666' }}>Quantidade:</strong> 
                  <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>{Number(item.quantidade).toFixed(8)} BTC</span>
                </p>
                <p style={{ margin: '8px 0', color: '#333' }}>
                  <strong style={{ color: '#666' }}>Preço:</strong> 
                  <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                    ${Number(item.preco).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </p>
                <p style={{ margin: '8px 0', color: '#666', fontSize: '12px' }}>
                  <strong>Timestamp:</strong> 
                  <span style={{ marginLeft: '8px' }}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : '-'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
