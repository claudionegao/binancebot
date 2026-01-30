import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

export default function Home() {
    const [saldo, setSaldo] = useState(0);
    const [saldoBTC, setSaldoBTC] = useState(0);
    const [positions, setPositions] = useState([]);
    const [btcPrice, setBtcPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const SOCKET_URL = 'https://binancesocket.onrender.com';
    const API_URL = 'https://binancesocket.onrender.com';

    useEffect(() => {
        // Conecta ao Socket.IO remoto
        const socket = io(SOCKET_URL, { transports: ['websocket'] });

        socket.on('saldo_atualizado', (data) => {
            setSaldo(data.saldo);
            setSaldoBTC(data.saldo_btc);
            setPositions(data.positions);
            setLoading(false);
        });

        socket.on('btc_price', (data) => {
            setBtcPrice(data.price);
        });

        // Busca saldo inicial via API REST remota
        axios.get(`${API_URL}/saldo`).then(res => {
            setSaldo(res.data.saldo);
            setSaldoBTC(res.data.saldo_btc);
            setPositions(res.data.positions);
            setLoading(false);
        }).catch(() => setLoading(false));

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: 'auto', padding: 20 }}>
            {loading ? (
                <p>Carregando dados...</p>
            ) : (
                <>
                    <p><strong>Saldo USD:</strong> ${saldo}</p>
                    <p><strong>Saldo BTC:</strong> {saldoBTC} BTC</p>
                    <p><strong>Preço BTC/USDT:</strong> ${btcPrice}</p>
                    <h2>Posições</h2>
                    <ul>
                        {positions && positions.length > 0 ? (
                            positions.map((pos, idx) => {
                                if (typeof pos === 'object' && pos !== null) {
                                    return (
                                        <li key={idx}>
                                            <div><strong>Quantidade:</strong> {pos.quantidade}</div>
                                            <div><strong>Preço:</strong> ${pos.preco}</div>
                                            <div><strong>Timestamp:</strong> {pos.timestamp ? new Date(pos.timestamp).toLocaleString('pt-BR') : '-'}</div>
                                        </li>
                                    );
                                } else {
                                    return <li key={idx}>{pos}</li>;
                                }
                            })
                        ) : (
                            <li>Nenhuma posição aberta</li>
                        )}
                    </ul>
                </>
            )}
        </div>
    );
}