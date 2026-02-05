import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Link from 'next/link';

const SOCKET_URL = 'https://binancesocket.onrender.com';

export default function Movimentacoes() {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket'] });

        socket.on('connect', () => {
            setConnected(true);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('state', (data) => {
            setState(data);
            setLoading(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

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
                    <h2 style={{ color: '#333', fontSize: '24px' }}>Carregando movimentações...</h2>
                </div>
            </div>
        );
    }

    const movimentacoes_de_lote = state?.movimentacoes_de_lote || [];

    // Calcular estatísticas
    const compras = movimentacoes_de_lote.filter(m => m.tipo === 'compra');
    const vendas = movimentacoes_de_lote.filter(m => m.tipo === 'venda');
    const totalComprado = compras.reduce((acc, m) => acc + (m.quantidade || 0), 0);
    const totalVendido = vendas.reduce((acc, m) => acc + (m.quantidade || 0), 0);
    const valorTotalCompras = compras.reduce((acc, m) => acc + (m.quantidade || 0) * (m.precoCompra || 0), 0);
    const valorTotalVendas = vendas.reduce((acc, m) => acc + (m.quantidade || 0) * (m.precoVenda || 0), 0);

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f5f5f5',
            minHeight: '100vh'
        }}>
            {/* Header com navegação */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h1 style={{ margin: 0 }}>📋 Movimentações</h1>
                <Link href="/" style={{
                    textDecoration: 'none',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                }}>
                    ← Voltar
                </Link>
            </div>

            {/* Status de conexão */}
            <p style={{
                color: connected ? 'green' : 'red',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '20px'
            }}>
                {connected ? '🟢 Conectado' : '🔴 Desconectado'}
            </p>

            {/* Cards de Estatísticas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                marginBottom: '25px'
            }}>
                <div style={{
                    backgroundColor: '#e8f5e9',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#2e7d32' }}>🟢 Total de Compras</h3>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0', color: '#1b5e20' }}>
                        {compras.length}
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        {totalComprado.toFixed(8)} BTC
                    </p>
                    <p style={{ fontSize: '16px', color: '#2e7d32', margin: '5px 0', fontWeight: '600' }}>
                        ${valorTotalCompras.toFixed(2)}
                    </p>
                </div>

                <div style={{
                    backgroundColor: '#fff3e0',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#e65100' }}>🔴 Total de Vendas</h3>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0', color: '#bf360c' }}>
                        {vendas.length}
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        {totalVendido.toFixed(8)} BTC
                    </p>
                    <p style={{ fontSize: '16px', color: '#e65100', margin: '5px 0', fontWeight: '600' }}>
                        ${valorTotalVendas.toFixed(2)}
                    </p>
                </div>

                <div style={{
                    backgroundColor: valorTotalVendas >= valorTotalCompras ? '#e8f5e9' : '#ffebee',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#616161' }}>💰 Resultado</h3>
                    <p style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        margin: '5px 0',
                        color: valorTotalVendas >= valorTotalCompras ? '#1b5e20' : '#c62828'
                    }}>
                        ${(valorTotalVendas - valorTotalCompras).toFixed(2)}
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        Saldo: {(totalVendido - totalComprado).toFixed(8)} BTC
                    </p>
                </div>
            </div>

            {/* Tabela de Movimentações */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
                    Histórico Completo ({movimentacoes_de_lote.length} movimentações)
                </h2>

                {movimentacoes_de_lote.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        Nenhuma movimentação registrada ainda
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{
                                        border: '1px solid #ddd',
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontWeight: 'bold'
                                    }}>
                                        #
                                    </th>
                                    <th style={{
                                        border: '1px solid #ddd',
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontWeight: 'bold'
                                    }}>
                                        Tipo
                                    </th>
                                    <th style={{
                                        border: '1px solid #ddd',
                                        padding: '12px 8px',
                                        textAlign: 'right',
                                        fontWeight: 'bold'
                                    }}>
                                        Quantidade BTC
                                    </th>
                                    <th style={{
                                        border: '1px solid #ddd',
                                        padding: '12px 8px',
                                        textAlign: 'right',
                                        fontWeight: 'bold'
                                    }}>
                                        Preço (USD)
                                    </th>
                                    <th style={{
                                        border: '1px solid #ddd',
                                        padding: '12px 8px',
                                        textAlign: 'right',
                                        fontWeight: 'bold'
                                    }}>
                                        Valor Total (USD)
                                    </th>
                                    <th style={{
                                        border: '1px solid #ddd',
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        fontWeight: 'bold'
                                    }}>
                                        Data/Hora
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimentacoes_de_lote.slice().reverse().map((mov, idx) => {
                                    const isCompra = mov.tipo === 'compra';
                                    const preco = mov.precoCompra || mov.precoVenda || 0;
                                    const quantidade = mov.quantidade || 0;
                                    const valorTotal = quantidade * preco;

                                    return (
                                        <tr key={idx} style={{
                                            backgroundColor: isCompra ? '#f1f8f4' : '#fff9f0',
                                            transition: 'background-color 0.2s'
                                        }}>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 8px',
                                                color: '#666'
                                            }}>
                                                {movimentacoes_de_lote.length - idx}
                                            </td>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 8px',
                                                fontWeight: 'bold'
                                            }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    backgroundColor: isCompra ? '#2e7d32' : '#e65100',
                                                    color: 'white',
                                                    fontSize: '12px'
                                                }}>
                                                    {mov.tipo === 'compra' ? '🟢 COMPRA' : mov.tipo === 'stop loss' ? '🔴 STOP LOSS' : '🔴 TAKE PROFIT'}
                                                </span>
                                            </td>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 8px',
                                                textAlign: 'right',
                                                fontFamily: 'monospace'
                                            }}>
                                                {quantidade.toFixed(8)}
                                            </td>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 8px',
                                                textAlign: 'right',
                                                fontFamily: 'monospace'
                                            }}>
                                                ${preco.toFixed(2)}
                                            </td>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 8px',
                                                textAlign: 'right',
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace',
                                                color: isCompra ? '#2e7d32' : '#e65100'
                                            }}>
                                                ${valorTotal.toFixed(2)}
                                            </td>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 8px',
                                                fontSize: '13px',
                                                color: '#666'
                                            }}>
                                                {mov.timestamp ? new Date(mov.timestamp).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                }) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
