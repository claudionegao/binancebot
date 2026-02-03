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
       const { saldoUSD, saldoBTC, positions, movimentacoes_de_lote, ultimosPrecosRapida, ultimosPrecosLenta, BTC_PRICE, MAX_LOTES, MEDIA_LENTA_N, MEDIA_RAPIDA_N, COOLDOWN_LOTES, MEDIA_RAPIDA, prev_MEDIA_RAPIDA, movimentacao_rapida, MEDIA_LENTA, prev_MEDIA_LENTA, movimentacao_lenta, LUCRO_MINIMO_PERCENT, STOP_LOSS_PERCENT, PERCENTUAL_COMPRA, PERCENTUAL_VENDA, THRESHOLD_CONFIRMACAO } = data;
        console.clear();
        console.log("Saldo USD:", saldoUSD);
        console.log("Saldo BTC:", saldoBTC);
        console.log("Preço BTC:", BTC_PRICE);
        console.log("Posições:", positions);
        console.log("Movimentações de Lote:", movimentacoes_de_lote);
        console.log("Últimos Preços Rápida:", ultimosPrecosRapida);
        console.log("Últimos Preços Lenta:", ultimosPrecosLenta);
        console.log("Média Rápida:", MEDIA_RAPIDA, "Anterior:", prev_MEDIA_RAPIDA, "Movimentação Rápida:", movimentacao_rapida);
        console.log("Média Lenta:", MEDIA_LENTA, "Anterior:", prev_MEDIA_LENTA, "Movimentação Lenta:", movimentacao_lenta);

    })

    return (<p>State</p>)
}