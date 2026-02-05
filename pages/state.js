'use client';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styles from '../styles/Home.module.css';

const SOCKET_URL = 'https://binancesocket.onrender.com';

export default function PaginaStatus() {
    const [state, setState] = useState(null);
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
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (!state) {
        return (
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                <h1>Status do Bot</h1>
                <p style={{ color: connected ? 'green' : 'red' }}>
                    {connected ? 'Conectado' : 'Desconectado'}
                </p>
                <p>Aguardando dados...</p>
            </div>
        );
    }

    const {
        saldoUSD,
        saldoCrypto,
        positions,
        movimentacoes_de_lote,
        ultimosPrecosRapida,
        ultimosPrecosLenta,
        PRICE,
        MAX_LOTES,
        MEDIA_LENTA_N,
        MEDIA_RAPIDA_N,
        COOLDOWN_LOTES,
        MEDIA_RAPIDA,
        prev_MEDIA_RAPIDA,
        movimentacao_rapida,
        MEDIA_LENTA,
        prev_MEDIA_LENTA,
        movimentacao_lenta,
        LUCRO_MINIMO_PERCENT,
        STOP_LOSS_PERCENT,
        PERCENTUAL_COMPRA,
        PERCENTUAL_VENDA,
        THRESHOLD_CONFIRMACAO,
    } = state;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <h1>📊 Status do Bot de Trading</h1>
            <p style={{ color: connected ? 'green' : 'red', fontSize: '16px', fontWeight: 'bold' }}>
                {connected ? '🟢 Conectado' : '🔴 Desconectado'}
            </p>

            {/* Saldos */}
            <section style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>💰 Saldos</h2>
                <p><strong>Saldo USD:</strong> ${saldoUSD?.toFixed(2) || '0.00'}</p>
                <p><strong>Saldo BTC:</strong> {saldoCrypto?.toFixed(8) || '0.00000000'} BTC</p>
            </section>

            {/* Preço Atual */}
            <section style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>📈 Preço Atual</h2>
                <p><strong>BTC Price:</strong> ${PRICE?.toFixed(2) || 'N/A'}</p>
            </section>

            {/* Médias */}
            <section style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>📊 Médias Móveis</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ borderLeft: '4px solid #0066cc', paddingLeft: '10px' }}>
                        <h3>Média Rápida (N={MEDIA_RAPIDA_N})</h3>
                        <p><strong>Valor:</strong> ${MEDIA_RAPIDA?.toFixed(2) || 'N/A'}</p>
                        <p><strong>Anterior:</strong> ${prev_MEDIA_RAPIDA?.toFixed(2) || 'N/A'}</p>
                        <p><strong>Movimentação:</strong> <span style={{ color: movimentacao_rapida > 0 ? 'green' : 'red' }}>
                            {movimentacao_rapida > 0 ? '↑' : '↓'} {movimentacao_rapida || 'N/A'}
                        </span></p>
                    </div>
                    <div style={{ borderLeft: '4px solid #cc6600', paddingLeft: '10px' }}>
                        <h3>Média Lenta (N={MEDIA_LENTA_N})</h3>
                        <p><strong>Valor:</strong> ${MEDIA_LENTA?.toFixed(2) || 'N/A'}</p>
                        <p><strong>Anterior:</strong> ${prev_MEDIA_LENTA?.toFixed(2) || 'N/A'}</p>
                        <p><strong>Movimentação:</strong> <span style={{ color: movimentacao_lenta > 0 ? 'green' : 'red' }}>
                            {movimentacao_lenta > 0 ? '↑' : '↓'} {movimentacao_lenta || 'N/A'}
                        </span></p>
                    </div>
                </div>
            </section>

            {/* Últimos Preços */}
            <section style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>📉 Histórico de Preços</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <h3>Últimos Preços Rápida</h3>
                        <p>{ultimosPrecosRapida?.map((p, i) => `$${p.toFixed(2)}`).join(' → ') || 'N/A'}</p>
                    </div>
                    <div>
                        <h3>Últimos Preços Lenta</h3>
                        <p>{ultimosPrecosLenta?.slice(0, 5).map((p, i) => `$${p.toFixed(2)}`).join(' → ') || 'N/A'}...</p>
                    </div>
                </div>
            </section>

            {/* Posições */}
            <section style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>🎯 Posições Abertas ({positions?.length || 0})</h2>
                {positions && positions.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Quantidade</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Restante</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Preço Compra</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Vendas</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Última Venda</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Comprado em</th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions.map((pos, idx) => (
                                    <tr key={pos.identificador || idx}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '11px' }}>{pos.identificador}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{pos.quantidadeBTC?.toFixed(8)}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: '#f7931a' }}>{pos.restante?.toFixed(8)}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>${pos.precoCompra?.toFixed(2)}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{pos.vendasrealizadas || 0}/3</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                                            {pos.ultimavenda ? new Date(pos.ultimavenda).toLocaleString('pt-BR') : '-'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                                            {/*data calculada com identificador que e o timestamp do lote */}
                                            {pos.identificador ? new Date(pos.identificador).toLocaleString('pt-BR') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Nenhuma posição aberta</p>
                )}
            </section>

            {/* Movimentações de Lote */}
            <section style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>📋 Movimentações de Lote ({movimentacoes_de_lote?.length || 0})</h2>
                {movimentacoes_de_lote && movimentacoes_de_lote.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f0f0f0' }}>
                                <tr>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tipo</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Quantidade BTC</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Preço</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data/Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimentacoes_de_lote.slice().reverse().map((mov, idx) => (
                                    <tr key={idx} style={{ backgroundColor: mov.tipo === 'compra' ? '#e8f5e9' : '#fff3e0' }}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>
                                            {mov.tipo === 'compra' ? '🟢 COMPRA' : mov.tipo === 'stop loss' ? '🔴 STOP LOSS' : '🔴 TAKE PROFIT'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            {mov.quantidade?.toFixed(8)} BTC
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            ${(mov.precoCompra || mov.precoVenda)?.toFixed(2)}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            {mov.timestamp ? new Date(mov.timestamp).toLocaleString('pt-BR') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Nenhuma movimentação registrada</p>
                )}
            </section>

            {/* Configurações */}
            <section style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2>⚙️ Configurações</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                        <p><strong>MAX_LOTES:</strong> {MAX_LOTES}</p>
                        <p><strong>COOLDOWN_LOTES:</strong> {COOLDOWN_LOTES}s</p>
                        <p><strong>THRESHOLD_CONFIRMACAO:</strong> {THRESHOLD_CONFIRMACAO}s</p>
                    </div>
                    <div>
                        <p><strong>LUCRO_MÍNIMO:</strong> {LUCRO_MINIMO_PERCENT}%</p>
                        <p><strong>STOP_LOSS:</strong> {STOP_LOSS_PERCENT}%</p>
                    </div>
                    <div>
                        <p><strong>PERCENTUAL_COMPRA:</strong> {PERCENTUAL_COMPRA}%</p>
                        <p><strong>PERCENTUAL_VENDA:</strong> {PERCENTUAL_VENDA}%</p>
                    </div>
                </div>
            </section>
        </div>
    );
}