import io from 'socket.io-client';
const SOCKET_URL = 'https://binancesocket.onrender.com';


export default function paginastatus() {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('state', (data) => {
        /*
        exibir dados nesse padrão limpando a cada iteração

        const state = {
  saldoUSD: 100.0,
  saldoBTC: 0.0,
  positions: [], // [{ quantidadeBTC, precoCompra, timestamp }]
  movimentacoes_de_lote: [],
  ultimosPrecosRapida: [], // armazena os últimos 5 preços do BTC
  ultimosPrecosLenta: [], // armazena os últimos 20 preços do BTC
  BTC_PRICE: null,
  MAX_LOTES: 5,
  MEDIA_LENTA_N: 100,
  MEDIA_RAPIDA_N: 20,
  COOLDOWN_LOTES: 60,
  MEDIA_RAPIDA: null,
  prev_MEDIA_RAPIDA: null,
  movimentacao_rapida: null,
  MEDIA_LENTA: null,
  prev_MEDIA_LENTA: null,
  movimentacao_lenta: null,
  // Configurações de venda
  LUCRO_MINIMO_PERCENT: 0.5, // Vender se lucro >= 0.5%
  STOP_LOSS_PERCENT: -1.0,   // Vender se prejuízo <= -1%
  PERCENTUAL_COMPRA: 5,       // Compra com 5% do saldo USD
  PERCENTUAL_VENDA: 5,      // Vende 5% do saldo BTC por lote
  THRESHOLD_CONFIRMACAO: 60,
};
        
        
        */
    })

    return (<p>State</p>)
}