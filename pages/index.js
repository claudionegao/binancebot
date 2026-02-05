import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import axios from 'axios';
import Link from 'next/link';

const SOCKET_URL = 'https://binancesocket.onrender.com';
const API_URL = 'https://binancesocket.onrender.com';

export default function Home() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastBtcUpdate, setLastBtcUpdate] = useState(Date.now());
  const [btcElapsed, setBtcElapsed] = useState(0);
  const [lastPrices, setLastPrices] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const saldo = state?.saldoUSD || 0;
  const saldoCrypto = state?.saldo || 0;
  const positions = state?.positions || [];
  const CryptoPrice = state?.PRICE || 0;
  const totalBloqueado = saldo + saldoCrypto * CryptoPrice;
  const COOLDOWN_LOTES = state?.COOLDOWN_LOTES || 60;

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('state', (data) => {
      setState(data);
      setLoading(false);

      // Atualizar o preço do BTC e histórico de preços
      if (data.PRICE !== null && data.PRICE !== undefined) {
        setLastBtcUpdate(Date.now());
        setBtcElapsed(0);

        setLastPrices((prev) => {
          const last = prev[0]?.price;
          let direction = 'same';
          let diff = 0;

          if (last !== undefined) {
            diff = data.PRICE - last;
            direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
          }

          const updated = [{ price: data.PRICE, diff, direction }, ...prev];
          return updated.slice(0, 10);
        });
      }
    });

    // Buscar estado inicial via API
    axios.get(`${API_URL}/saldo`).then((res) => {
      setState(res.data);

      if (res.data.PRICE !== undefined && res.data.PRICE !== null) {
        setLastBtcUpdate(Date.now());
        setLastPrices([{ price: res.data.PRICE, diff: 0, direction: 'same' }]);
      }

      setLoading(false);
    }).catch(() => setLoading(false));

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBtcElapsed(Math.floor((Date.now() - lastBtcUpdate) / 1000));
      setCurrentTime(Date.now());
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1f2937', margin: 0 }}>📊 Binance Bot Dashboard</h1>
        <Link href="/movimentacoes" style={{
          textDecoration: 'none',
          backgroundColor: '#0066cc',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          transition: 'background-color 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          📋 Ver Movimentações
        </Link>
      </div>

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
            {Number(saldoCrypto).toFixed(8)}
          </p>
          <p style={{ color: '#999', fontSize: '12px', margin: '8px 0 0 0' }}>
            ${(saldoCrypto * CryptoPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
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
            ${CryptoPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '15px'
          }}>
            {positions.map((item, index) => {
              const lucroPercentual = ((CryptoPrice - item.precoCompra) / item.precoCompra) * 100;
              const lucroUSD = (item.restante || 0) * (CryptoPrice - item.precoCompra);
              const corLucro = lucroPercentual >= 0 ? '#00c853' : '#d32f2f';
              
              // Calcular cooldown
              const temUltimaVenda = item.ultimavenda && item.ultimavenda > 0;
              const segundosDesdeVenda = temUltimaVenda 
                ? Math.floor((currentTime - item.ultimavenda) / 1000) 
                : 0;
              const cooldownRestante = Math.max(0, COOLDOWN_LOTES - segundosDesdeVenda);
              const isActive = !temUltimaVenda || cooldownRestante === 0;
              
              return (
                <div key={item.identificador || index} style={{
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
                      Lote #{index + 1}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: '#999',
                      fontFamily: 'monospace'
                    }}>
                      ID: {item.identificador}
                    </span>
                  </div>
                  
                  {/* Status do Cooldown */}
                  <div style={{
                    backgroundColor: isActive ? '#e8f5e9' : '#fff3e0',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    textAlign: 'center',
                    border: `2px solid ${isActive ? '#00c853' : '#ff9800'}`
                  }}>
                    {isActive ? (
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#00c853' }}>
                        ✓ ACTIVE
                      </p>
                    ) : (
                      <>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666' }}>
                          COOLDOWN
                        </p>
                        <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>
                          {cooldownRestante}s
                        </p>
                      </>
                    )}
                  </div>

                  {/* Lucro/Prejuízo */}
                  <div style={{
                    backgroundColor: lucroPercentual >= 0 ? '#e8f5e9' : '#ffebee',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
                      Resultado
                    </p>
                    <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: corLucro }}>
                      {lucroPercentual >= 0 ? '+' : ''}{lucroPercentual.toFixed(2)}%
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: corLucro }}>
                      {lucroUSD >= 0 ? '+' : ''}${lucroUSD.toFixed(2)} USD
                    </p>
                  </div>

                  {/* Informações do Lote */}
                  <p style={{ margin: '8px 0', color: '#333', fontSize: '13px' }}>
                    <strong style={{ color: '#666' }}>Total Comprado:</strong> 
                    <span style={{ marginLeft: '8px', fontFamily: 'monospace', float: 'right' }}>
                      {Number(item.quantidade || 0).toFixed(8)} BTC
                    </span>
                  </p>
                  <p style={{ margin: '8px 0', color: '#333', fontSize: '13px' }}>
                    <strong style={{ color: '#666' }}>Restante:</strong> 
                    <span style={{ marginLeft: '8px', fontFamily: 'monospace', float: 'right', color: '#f7931a', fontWeight: 'bold' }}>
                      {Number(item.restante || 0).toFixed(8)} BTC
                    </span>
                  </p>
                  <p style={{ margin: '8px 0', color: '#333', fontSize: '13px' }}>
                    <strong style={{ color: '#666' }}>Preço Compra:</strong> 
                    <span style={{ marginLeft: '8px', fontFamily: 'monospace', float: 'right' }}>
                      ${Number(item.precoCompra || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                  <p style={{ margin: '8px 0', color: '#333', fontSize: '13px' }}>
                    <strong style={{ color: '#666' }}>Vendas Realizadas:</strong> 
                    <span style={{ marginLeft: '8px', float: 'right' }}>
                      {item.vendasrealizadas || 0}/3
                    </span>
                  </p>

                  {/* Progress Bar de Vendas */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${((item.vendasrealizadas || 0) / 3) * 100}%`,
                        height: '100%',
                        backgroundColor: '#0066cc',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Timestamp e Última Venda */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                    <p style={{ margin: '4px 0', color: '#666', fontSize: '11px' }}>
                      <strong>Comprado em:</strong> 
                      <span style={{ marginLeft: '8px' }}>
                        {item.identificador ? new Date(item.identificador).toLocaleString('pt-BR') : '-'}
                      </span>
                    </p>
                    {item.ultimavenda && (
                      <p style={{ margin: '4px 0', color: '#666', fontSize: '11px' }}>
                        <strong>Última venda:</strong> 
                        <span style={{ marginLeft: '8px' }}>
                          {new Date(item.ultimavenda).toLocaleString('pt-BR')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
