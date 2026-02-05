import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Link from 'next/link';

const SOCKET_URL = 'https://binancesocket.onrender.com';

export default function Movimentacoes() {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [filtros, setFiltros] = useState({
        tipo: 'todos',
        dataInicio: '',
        dataFim: '',
        quantidadeMin: '',
        quantidadeMax: '',
        precoMin: '',
        precoMax: ''
    });
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

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
    const PRICE = state?.PRICE || 0;
    const saldoCrypto = state?.saldoCrypto || 0;

    // Filtrar movimentações
    const movimentacoesFiltradas = movimentacoes_de_lote.filter(m => {
        if (filtros.tipo !== 'todos' && m.tipo !== filtros.tipo) return false;
        if (filtros.dataInicio || filtros.dataFim) {
            const dataMov = m.timestamp ? new Date(m.timestamp) : null;
            if (!dataMov) return false;
            if (filtros.dataInicio) {
                const dataInicio = new Date(filtros.dataInicio);
                dataInicio.setHours(0, 0, 0, 0);
                if (dataMov < dataInicio) return false;
            }
            if (filtros.dataFim) {
                const dataFim = new Date(filtros.dataFim);
                dataFim.setHours(23, 59, 59, 999);
                if (dataMov > dataFim) return false;
            }
        }
        const quantidade = m.quantidade || 0;
        if (filtros.quantidadeMin && quantidade < parseFloat(filtros.quantidadeMin)) return false;
        if (filtros.quantidadeMax && quantidade > parseFloat(filtros.quantidadeMax)) return false;
        const preco = m.precoCompra || m.precoVenda || 0;
        if (filtros.precoMin && preco < parseFloat(filtros.precoMin)) return false;
        if (filtros.precoMax && preco > parseFloat(filtros.precoMax)) return false;
        return true;
    });

    // Calcular estatísticas (ALL, não filtradas)
    const comprasAll = movimentacoes_de_lote.filter(m => m.tipo === 'compra');
    const vendasAll = movimentacoes_de_lote.filter(m => m.tipo === 'venda' || m.tipo === 'stop loss' || m.tipo === 'take profit');
    const totalCompradoAll = comprasAll.reduce((acc, m) => acc + (m.quantidade || 0), 0);
    const totalVendidoAll = vendasAll.reduce((acc, m) => acc + (m.quantidade || 0), 0);
    const valorTotalComprasAll = comprasAll.reduce((acc, m) => acc + (m.quantidade || 0) * (m.precoCompra || 0), 0);
    const valorTotalVendasAll = vendasAll.reduce((acc, m) => acc + (m.quantidade || 0) * (m.precoVenda || 0), 0);
    
    // Calcular o saldo em posição aberta (BTC não vendido)
    const saldoEmAbertoQuantidade = totalCompradoAll - totalVendidoAll;
    const saldoAberto = saldoEmAbertoQuantidade * PRICE;
    const resultadoTotal = (valorTotalVendasAll - valorTotalComprasAll) + saldoAberto;

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
                        {comprasAll.length}
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        {totalCompradoAll.toFixed(8)} BTC
                    </p>
                    <p style={{ fontSize: '16px', color: '#2e7d32', margin: '5px 0', fontWeight: '600' }}>
                        ${valorTotalComprasAll.toFixed(2)}
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
                        {vendasAll.length}
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        {totalVendidoAll.toFixed(8)} BTC
                    </p>
                    <p style={{ fontSize: '16px', color: '#e65100', margin: '5px 0', fontWeight: '600' }}>
                        ${valorTotalVendasAll.toFixed(2)}
                    </p>
                </div>

                <div style={{
                    backgroundColor: valorTotalVendasAll >= valorTotalComprasAll ? '#e8f5e9' : '#ffebee',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#616161' }}>💰 Resultado</h3>
                    <p style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        margin: '5px 0',
                        color: resultadoTotal >= 0 ? '#1b5e20' : '#c62828'
                    }}>
                        ${resultadoTotal.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                        Saldo: {saldoEmAbertoQuantidade.toFixed(8)} BTC
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
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ margin: 0 }}>
                        Histórico Completo ({movimentacoesFiltradas.length} de {movimentacoes_de_lote.length} movimentações)
                    </h2>
                    <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        style={{
                            backgroundColor: '#0066cc',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}
                    >
                        {mostrarFiltros ? '🔽 Ocultar Filtros' : '🔼 Mostrar Filtros'}
                    </button>
                </div>

                {mostrarFiltros && (
                    <div style={{
                        backgroundColor: '#f9f9f9',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>⚙️ Filtros</h3>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px',
                            marginBottom: '15px'
                        }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Tipo</label>
                                <select
                                    value={filtros.tipo}
                                    onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontFamily: 'Arial',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="todos">Todos</option>
                                    <option value="compra">🟢 Compras</option>
                                    <option value="venda">🔵 Vendas</option>
                                    <option value="stop loss">🔴 Stop Loss</option>
                                    <option value="take profit">🟡 Take Profit</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Data Início</label>
                                <input
                                    type="date"
                                    value={filtros.dataInicio}
                                    onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Data Fim</label>
                                <input
                                    type="date"
                                    value={filtros.dataFim}
                                    onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Qtd Mín (BTC)</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    value={filtros.quantidadeMin}
                                    onChange={(e) => setFiltros({...filtros, quantidadeMin: e.target.value})}
                                    placeholder="0.001"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Qtd Máx (BTC)</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    value={filtros.quantidadeMax}
                                    onChange={(e) => setFiltros({...filtros, quantidadeMax: e.target.value})}
                                    placeholder="0.1"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Preço Mín (USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filtros.precoMin}
                                    onChange={(e) => setFiltros({...filtros, precoMin: e.target.value})}
                                    placeholder="20000"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Preço Máx (USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filtros.precoMax}
                                    onChange={(e) => setFiltros({...filtros, precoMax: e.target.value})}
                                    placeholder="70000"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setFiltros({
                                tipo: 'todos',
                                dataInicio: '',
                                dataFim: '',
                                quantidadeMin: '',
                                quantidadeMax: '',
                                precoMin: '',
                                precoMax: ''
                            })}
                            style={{
                                backgroundColor: '#666',
                                color: 'white',
                                border: 'none',
                                padding: '8px 15px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🔄 Limpar Filtros
                        </button>
                    </div>
                )}

                {movimentacoesFiltradas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        Nenhuma movimentação encontrada com os filtros aplicados
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
                                {movimentacoesFiltradas.slice().reverse().map((mov, idx) => {
                                    const preco = mov.precoCompra || mov.precoVenda || 0;
                                    const quantidade = mov.quantidade || 0;
                                    const valorTotal = quantidade * preco;
                                    let bgColor, textColor, badgeBg, label;
                                    
                                    switch(mov.tipo) {
                                        case 'compra':
                                            bgColor = '#f1f8f4';
                                            badgeBg = '#2e7d32';
                                            textColor = '#1b5e20';
                                            label = '🟢 COMPRA';
                                            break;
                                        case 'venda':
                                            bgColor = '#e3f2fd';
                                            badgeBg = '#1565c0';
                                            textColor = '#0d47a1';
                                            label = '🔵 VENDA';
                                            break;
                                        case 'stop loss':
                                            bgColor = '#ffebee';
                                            badgeBg = '#c62828';
                                            textColor = '#b71c1c';
                                            label = '🔴 STOP LOSS';
                                            break;
                                        case 'take profit':
                                            bgColor = '#fffde7';
                                            badgeBg = '#f57f17';
                                            textColor = '#e65100';
                                            label = '🟡 TAKE PROFIT';
                                            break;
                                        default:
                                            bgColor = '#f5f5f5';
                                            badgeBg = '#666';
                                            textColor = '#333';
                                            label = mov.tipo.toUpperCase();
                                    }

                                    return (
                                        <tr key={idx} style={{
                                            backgroundColor: bgColor,
                                            transition: 'background-color 0.2s'
                                        }}>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '12px 8px',
                                                color: '#666'
                                            }}>
                                                {movimentacoesFiltradas.length - idx}
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
                                                    backgroundColor: badgeBg,
                                                    color: 'white',
                                                    fontSize: '12px'
                                                }}>
                                                    {label}
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
                                                color: textColor
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
