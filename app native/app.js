import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';

const SOCKET_URL = 'https://binancesocket.onrender.com';
const API_URL = 'https://binancesocket.onrender.com';

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastBtcUpdate, setLastBtcUpdate] = useState(Date.now());
  const [btcElapsed, setBtcElapsed] = useState(0);
  const [lastPrices, setLastPrices] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const saldo = state?.saldoUSD || 0;
  const saldoBTC = state?.saldoBTC || 0;
  const positions = state?.positions || [];
  const btcPrice = state?.BTC_PRICE || 0;
  const totalBloqueado = saldo + saldoBTC * btcPrice;
  const COOLDOWN_LOTES = state?.COOLDOWN_LOTES || 60;

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('state', (data) => {
      setState(data);
      setLoading(false);

      if (data.BTC_PRICE !== null && data.BTC_PRICE !== undefined) {
        setLastBtcUpdate(Date.now());
        setBtcElapsed(0);

        setLastPrices((prev) => {
          const last = prev[0]?.price;
          let diff = 0;

          if (last !== undefined) diff = data.BTC_PRICE - last;

          return [{ price: data.BTC_PRICE, diff }, ...prev].slice(0, 5);
        });
      }
    });

    axios.get(`${API_URL}/saldo`).then((res) => {
      setState(res.data);
      if (res.data.BTC_PRICE) {
        setLastBtcUpdate(Date.now());
        setLastPrices([{ price: res.data.BTC_PRICE, diff: 0 }]);
      }
      setLoading(false);
    });

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f0b90b" />
        <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Binance Bot</Text>

        {/* SALDOS */}
        <View style={styles.card}>
          <Text style={styles.label}>Saldo USD</Text>
          <Text style={styles.value}>
            $
            {Number(saldo).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Saldo BTC</Text>
          <Text style={styles.value}>{saldoBTC.toFixed(8)} BTC</Text>
          <Text style={styles.muted}>
            $
            {(saldoBTC * btcPrice).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}{' '}
            USD bloqueado
          </Text>
        </View>

        {/* BTC PRICE */}
        <View style={styles.card}>
          <Text style={styles.label}>BTC / USDT</Text>
          <Text style={styles.value}>
            $
            {btcPrice.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.muted}>Atualizado há {btcElapsed}s</Text>
        </View>

        {/* MOVIMENTAÇÃO */}
        <Text style={styles.section}>Movimentação</Text>

        {lastPrices.map((item, index) => {
          const isUp = item.diff > 0;
          const isDown = item.diff < 0;

          const bg = isUp ? '#e8f7ef' : isDown ? '#fdeaea' : '#f0f0f0';
          const color = isUp ? '#16c784' : isDown ? '#ea3943' : '#999';
          const icon = isUp
            ? 'trending-up'
            : isDown
            ? 'trending-down'
            : 'remove';

          return (
            <View
              key={index}
              style={[styles.tickRow, { backgroundColor: bg }]}>
              <Ionicons name={icon} size={18} color={color} />

              <Text style={[styles.tickValue, { color }]}>
                {isUp && '+'}
                {item.diff.toFixed(2)} USD
              </Text>
            </View>
          );
        })}

        {/* TOTAL */}
        <View style={[styles.card, styles.totalCard]}>
          <Text style={styles.label}>Total (USD + Bloqueado)</Text>
          <Text style={styles.totalValue}>
            $
            {totalBloqueado.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* POSIÇÕES */}
        <Text style={styles.section}>
          Posições Abertas ({positions.length})
        </Text>

        {positions.length === 0 ? (
          <Text style={styles.muted}>Nenhuma posição aberta</Text>
        ) : (
          positions.map((item, index) => {
            const lucroPercentual =
              ((btcPrice - item.precoCompra) / item.precoCompra) * 100;
            const lucroUSD = (item.restante || 0) * (btcPrice - item.precoCompra);
            const corLucro = lucroPercentual >= 0 ? '#16c784' : '#ea3943';

            const temUltimaVenda = item.ultimavenda && item.ultimavenda > 0;
            const segundosDesdeVenda = temUltimaVenda
              ? Math.floor((currentTime - item.ultimavenda) / 1000)
              : 0;
            const cooldownRestante = Math.max(0, COOLDOWN_LOTES - segundosDesdeVenda);
            const isActive = !temUltimaVenda || cooldownRestante === 0;

            return (
              <View key={item.identificador || index} style={styles.card}>
                {/* Header */}
                <View style={styles.positionHeader}>
                  <Text style={styles.positionBadge}>Lote #{index + 1}</Text>
                  <Text style={styles.positionId}>ID: {item.identificador}</Text>
                </View>

                {/* Status Cooldown */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isActive ? '#e8f7ef' : '#fff3e0' },
                  ]}>
                  {isActive ? (
                    <Text style={[styles.statusText, { color: '#16c784' }]}>
                      ✓ ACTIVE
                    </Text>
                  ) : (
                    <Text style={[styles.statusText, { color: '#ff9800' }]}>
                      COOLDOWN: {cooldownRestante}s
                    </Text>
                  )}
                </View>

                {/* Lucro/Prejuízo */}
                <View
                  style={[
                    styles.lucroCard,
                    {
                      backgroundColor:
                        lucroPercentual >= 0 ? '#e8f7ef' : '#fdeaea',
                    },
                  ]}>
                  <Text style={styles.lucroLabel}>Resultado</Text>
                  <Text style={[styles.lucroValue, { color: corLucro }]}>
                    {lucroPercentual >= 0 ? '+' : ''}
                    {lucroPercentual.toFixed(2)}%
                  </Text>
                  <Text style={[styles.lucroUSD, { color: corLucro }]}>
                    {lucroUSD >= 0 ? '+' : ''}${lucroUSD.toFixed(2)}
                  </Text>
                </View>

                {/* Informações */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Comprado:</Text>
                  <Text style={styles.infoValue}>
                    {(item.quantidadeBTC || 0).toFixed(8)} BTC
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Restante:</Text>
                  <Text style={[styles.infoValue, { color: '#f0b90b', fontWeight: '700' }]}>
                    {(item.restante || 0).toFixed(8)} BTC
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Preço Compra:</Text>
                  <Text style={styles.infoValue}>
                    $
                    {(item.precoCompra || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vendas Realizadas:</Text>
                  <Text style={styles.infoValue}>
                    {item.vendasrealizadas || 0}/3
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${((item.vendasrealizadas || 0) / 3) * 100}%`,
                      },
                    ]}
                  />
                </View>

                {/* Timestamps */}
                <Text style={styles.timestamp}>
                  Comprado: {item.timestamp ? new Date(item.timestamp).toLocaleString('pt-BR') : '-'}
                </Text>
                {item.ultimavenda && (
                  <Text style={styles.timestamp}>
                    Última venda: {new Date(item.ultimavenda).toLocaleString('pt-BR')}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  totalCard: {
    backgroundColor: '#fff7e6',
  },
  label: {
    fontSize: 13,
    color: '#666',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f0b90b',
  },
  muted: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  bold: {
    fontWeight: '600',
  },
  cardText: {
    fontSize: 14,
    marginBottom: 4,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  tickValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Novos estilos para posições
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  positionBadge: {
    backgroundColor: '#0066cc',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
  },
  positionId: {
    fontSize: 9,
    color: '#999',
  },
  statusBadge: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lucroCard: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  lucroLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  lucroValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  lucroUSD: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0066cc',
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
});
