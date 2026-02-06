import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';

const SOCKET_URL = 'https://binancesocket.onrender.com';
const API_URL = 'https://binancesocket.onrender.com';
const { width } = Dimensions.get('window');

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastBtcUpdate, setLastBtcUpdate] = useState(Date.now());
  const [btcElapsed, setBtcElapsed] = useState(0);
  const [lastPrices, setLastPrices] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' ou 'movimentacoes'
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    dataInicio: '',
    dataFim: '',
    quantidadeMin: '',
    quantidadeMax: '',
    precoMin: '',
    precoMax: '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const saldo = state?.saldoUSD || 0;
  const saldoCrypto = state?.saldo || 0;
  const positions = state?.positions || [];
  const movimentacoes_de_lote = state?.movimentacoes_de_lote || [];
  const CryptoPrice = state?.PRICE || 0;
  const totalBloqueado = saldo + saldoCrypto * CryptoPrice;
  const COOLDOWN_LOTES = state?.COOLDOWN_LOTES || 60;

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('state', (data) => {
      setState(data);
      setLoading(false);

      if (data.PRICE !== null && data.PRICE !== undefined) {
        setLastBtcUpdate(Date.now());
        setBtcElapsed(0);

        setLastPrices((prev) => {
          const last = prev[0]?.price;
          let diff = 0;

          if (last !== undefined) diff = data.PRICE - last;

          return [{ price: data.PRICE, diff }, ...prev].slice(0, 5);
        });
      }
    });

    axios.get(`${API_URL}/saldo`).then((res) => {
      setState(res.data);
      if (res.data.PRICE) {
        setLastBtcUpdate(Date.now());
        setLastPrices([{ price: res.data.PRICE, diff: 0 }]);
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

  const parseDate = (value, isEnd) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (isEnd) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const dataInicio = parseDate(filtros.dataInicio, false);
  const dataFim = parseDate(filtros.dataFim, true);

  const movimentacoesFiltradas = movimentacoes_de_lote.filter((m) => {
    if (filtros.tipo !== 'todos' && m.tipo !== filtros.tipo) return false;

    if (dataInicio || dataFim) {
      const dataMov = m.timestamp ? new Date(m.timestamp) : null;
      if (!dataMov || Number.isNaN(dataMov.getTime())) return false;
      if (dataInicio && dataMov < dataInicio) return false;
      if (dataFim && dataMov > dataFim) return false;
    }

    const quantidade = m.quantidade || 0;
    if (
      filtros.quantidadeMin &&
      quantidade < parseFloat(filtros.quantidadeMin)
    )
      return false;
    if (
      filtros.quantidadeMax &&
      quantidade > parseFloat(filtros.quantidadeMax)
    )
      return false;

    const preco = m.precoCompra || m.precoVenda || 0;
    if (filtros.precoMin && preco < parseFloat(filtros.precoMin)) return false;
    if (filtros.precoMax && preco > parseFloat(filtros.precoMax)) return false;

    return true;
  });

  // Calcular estatísticas de movimentações
  const compras = movimentacoes_de_lote.filter((m) => m.tipo === 'compra');
  const vendas = movimentacoes_de_lote.filter(
    (m) =>
      m.tipo === 'venda' || m.tipo === 'stop loss' || m.tipo === 'take profit'
  );
  const totalComprado = compras.reduce(
    (acc, m) => acc + (m.quantidade || 0),
    0
  );
  const totalVendido = vendas.reduce((acc, m) => acc + (m.quantidade || 0), 0);
  const valorTotalCompras = compras.reduce(
    (acc, m) => acc + (m.quantidade || 0) * (m.precoCompra || 0),
    0
  );
  const valorTotalVendas = vendas.reduce(
    (acc, m) => acc + (m.quantidade || 0) * (m.precoVenda || 0),
    0
  );
  const saldoEmAbertoQuantidade = totalComprado - totalVendido;
  const saldoAberto = saldoEmAbertoQuantidade * CryptoPrice;
  const resultadoTotal = valorTotalVendas - valorTotalCompras + saldoAberto;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header com Navegação */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Binance Bot</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              currentView === 'dashboard' && styles.tabActive,
            ]}
            onPress={() => setCurrentView('dashboard')}>
            <Ionicons
              name="home"
              size={20}
              color={currentView === 'dashboard' ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                currentView === 'dashboard' && styles.tabTextActive,
              ]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              currentView === 'movimentacoes' && styles.tabActive,
            ]}
            onPress={() => setCurrentView('movimentacoes')}>
            <Ionicons
              name="list"
              size={20}
              color={currentView === 'movimentacoes' ? '#fff' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                currentView === 'movimentacoes' && styles.tabTextActive,
              ]}>
              Movimentações
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo baseado na view atual */}
      {currentView === 'dashboard' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}>
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
            <Text style={styles.value}>{saldoCrypto.toFixed(8)} BTC</Text>
            <Text style={styles.muted}>
              $
              {(saldoCrypto * CryptoPrice).toLocaleString('en-US', {
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
              {CryptoPrice.toLocaleString('en-US', {
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
                ((CryptoPrice - item.precoCompra) / item.precoCompra) * 100;

              const lucroUSD =
                (item.restante || 0) * (CryptoPrice - item.precoCompra);

              const melhorPreco = item.melhorpreco || item.precoCompra;

              const lucroMaxPercent =
                ((melhorPreco - item.precoCompra) / item.precoCompra) * 100;

              const lucroMaxUSD =
                (item.restante || 0) * (melhorPreco - item.precoCompra);

              const drawdownPercent =
                ((CryptoPrice - melhorPreco) / melhorPreco) * 100;

              const corLucro = lucroPercentual >= 0 ? '#16c784' : '#ea3943';

              const temUltimaVenda = item.ultimavenda && item.ultimavenda > 0;
              const segundosDesdeVenda = temUltimaVenda
                ? Math.floor((currentTime - item.ultimavenda) / 1000)
                : 0;

              const cooldownRestante = Math.max(
                0,
                COOLDOWN_LOTES - segundosDesdeVenda
              );

              const isActive = !temUltimaVenda || cooldownRestante === 0;

              return (
                <View key={item.identificador || index} style={styles.card}>
                  {/* Header */}
                  <View style={styles.positionHeader}>
                    <Text style={styles.positionBadge}>Lote #{index + 1}</Text>
                    <Text style={styles.positionId}>
                      ID: {item.identificador}
                    </Text>
                  </View>

                  {/* Status */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isActive ? '#e8f7ef' : '#fff3e0' },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: isActive ? '#16c784' : '#ff9800' },
                      ]}>
                      {isActive ? '✓ ACTIVE' : `COOLDOWN: ${cooldownRestante}s`}
                    </Text>
                  </View>

                  {/* Lucro Atual */}
                  <View
                    style={[
                      styles.lucroCard,
                      {
                        backgroundColor:
                          lucroPercentual >= 0 ? '#e8f7ef' : '#fdeaea',
                      },
                    ]}>
                    <Text style={styles.lucroLabel}>Resultado Atual</Text>
                    <Text style={[styles.lucroValue, { color: corLucro }]}>
                      {lucroPercentual >= 0 ? '+' : ''}
                      {lucroPercentual.toFixed(2)}%
                    </Text>
                    <Text style={[styles.lucroUSD, { color: corLucro }]}>
                      {lucroUSD >= 0 ? '+' : ''}${lucroUSD.toFixed(2)}
                    </Text>
                  </View>

                  {/* Melhor Preço / Máximo */}
                  <View
                    style={[styles.lucroCard, { backgroundColor: '#e3f2fd' }]}>
                    <Text style={styles.lucroLabel}>Máx. Alcançado</Text>
                    <Text style={[styles.lucroValue, { color: '#1565c0' }]}>
                      +{lucroMaxPercent.toFixed(2)}%
                    </Text>
                    <Text style={[styles.lucroUSD, { color: '#1565c0' }]}>
                      +${lucroMaxUSD.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.muted,
                        {
                          marginTop: 4,
                          color: drawdownPercent < 0 ? '#ea3943' : '#16c784',
                        },
                      ]}>
                      Desde o topo: {drawdownPercent.toFixed(2)}%
                    </Text>
                  </View>

                  {/* Informações */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Comprado:</Text>
                    <Text style={styles.infoValue}>
                      {(item.quantidade || 0).toFixed(8)} BTC
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Restante:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: '#f0b90b', fontWeight: '700' },
                      ]}>
                      {(item.restante || 0).toFixed(8)} BTC
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Preço Compra:</Text>
                    <Text style={styles.infoValue}>
                      ${item.precoCompra.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Melhor Preço:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: '#1565c0', fontWeight: '700' },
                      ]}>
                      ${melhorPreco.toFixed(2)}
                    </Text>
                  </View>

                  {/* Progresso */}
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

                  {/* Datas */}
                  <Text style={styles.timestamp}>
                    Comprado:{' '}
                    {item.timestamp
                      ? new Date(item.identificador).toLocaleString('pt-BR')
                      : '-'}
                  </Text>

                  {item.ultimavenda && (
                    <Text style={styles.timestamp}>
                      Última venda:{' '}
                      {new Date(item.ultimavenda).toLocaleString('pt-BR')}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* Tela de Movimentações */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}>
          {/* Cards de Estatísticas */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.statLabel}>🟢 Compras</Text>
              <Text style={[styles.statValue, { color: '#2e7d32' }]}>
                {compras.length}
              </Text>
              <Text style={styles.statDetail}>
                {totalComprado.toFixed(6)} BTC
              </Text>
              <Text style={[styles.statMoney, { color: '#2e7d32' }]}>
                ${valorTotalCompras.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
              <Text style={styles.statLabel}>🔴 Vendas</Text>
              <Text style={[styles.statValue, { color: '#e65100' }]}>
                {vendas.length}
              </Text>
              <Text style={styles.statDetail}>
                {totalVendido.toFixed(6)} BTC
              </Text>
              <Text style={[styles.statMoney, { color: '#e65100' }]}>
                ${valorTotalVendas.toFixed(2)}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor:
                    resultadoTotal >= 0 ? '#e8f5e9' : '#ffebee',
                },
              ]}>
              <Text style={styles.statLabel}>💰 Resultado</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: resultadoTotal >= 0 ? '#2e7d32' : '#c62828',
                  },
                ]}>
                ${resultadoTotal.toFixed(2)}
              </Text>
              <Text style={styles.statDetail}>
                Saldo: {saldoEmAbertoQuantidade.toFixed(6)} BTC
              </Text>
            </View>
          </View>

          {/* Lista de Movimentações */}
          <Text style={styles.section}>
            Histórico ({movimentacoesFiltradas.length} de{' '}
            {movimentacoes_de_lote.length} movimentações)
          </Text>

          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setMostrarFiltros((prev) => !prev)}>
            <Ionicons
              name={mostrarFiltros ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#fff"
            />
            <Text style={styles.filterToggleText}>
              {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Text>
          </TouchableOpacity>

          {mostrarFiltros && (
            <View style={styles.filtersCard}>
              <Text style={styles.filtersTitle}>Filtros</Text>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Tipo</Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'todos', label: 'Todos' },
                    { value: 'compra', label: 'Compras' },
                    { value: 'venda', label: 'Vendas' },
                    { value: 'stop loss', label: 'Stop Loss' },
                    { value: 'take profit', label: 'Take Profit' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        filtros.tipo === option.value &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setFiltros((prev) => ({
                          ...prev,
                          tipo: option.value,
                        }))
                      }>
                      <Text
                        style={[
                          styles.filterOptionText,
                          filtros.tipo === option.value &&
                            styles.filterOptionTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>Data Inicio</Text>
                  <TextInput
                    value={filtros.dataInicio}
                    onChangeText={(value) =>
                      setFiltros((prev) => ({ ...prev, dataInicio: value }))
                    }
                    placeholder="YYYY-MM-DD"
                    style={styles.filterInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>Data Fim</Text>
                  <TextInput
                    value={filtros.dataFim}
                    onChangeText={(value) =>
                      setFiltros((prev) => ({ ...prev, dataFim: value }))
                    }
                    placeholder="YYYY-MM-DD"
                    style={styles.filterInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>Qtd Min (BTC)</Text>
                  <TextInput
                    value={filtros.quantidadeMin}
                    onChangeText={(value) =>
                      setFiltros((prev) => ({
                        ...prev,
                        quantidadeMin: value,
                      }))
                    }
                    placeholder="0.001"
                    keyboardType="numeric"
                    style={styles.filterInput}
                  />
                </View>

                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>Qtd Max (BTC)</Text>
                  <TextInput
                    value={filtros.quantidadeMax}
                    onChangeText={(value) =>
                      setFiltros((prev) => ({
                        ...prev,
                        quantidadeMax: value,
                      }))
                    }
                    placeholder="0.1"
                    keyboardType="numeric"
                    style={styles.filterInput}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>Preco Min (USD)</Text>
                  <TextInput
                    value={filtros.precoMin}
                    onChangeText={(value) =>
                      setFiltros((prev) => ({ ...prev, precoMin: value }))
                    }
                    placeholder="20000"
                    keyboardType="numeric"
                    style={styles.filterInput}
                  />
                </View>

                <View style={styles.filterField}>
                  <Text style={styles.filterLabel}>Preco Max (USD)</Text>
                  <TextInput
                    value={filtros.precoMax}
                    onChangeText={(value) =>
                      setFiltros((prev) => ({ ...prev, precoMax: value }))
                    }
                    placeholder="70000"
                    keyboardType="numeric"
                    style={styles.filterInput}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.clearFilters}
                onPress={() =>
                  setFiltros({
                    tipo: 'todos',
                    dataInicio: '',
                    dataFim: '',
                    quantidadeMin: '',
                    quantidadeMax: '',
                    precoMin: '',
                    precoMax: '',
                  })
                }>
                <Text style={styles.clearFiltersText}>Limpar filtros</Text>
              </TouchableOpacity>
            </View>
          )}

          {movimentacoesFiltradas.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', padding: 30 }]}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
              <Text style={styles.muted}>
                Nenhuma movimentação encontrada
              </Text>
            </View>
          ) : (
            movimentacoesFiltradas
              .slice()
              .reverse()
              .map((mov, idx) => {
                const isCompra = mov.tipo === 'compra';
                const preco = mov.precoCompra || mov.precoVenda || 0;
                const quantidade = mov.quantidade || 0;
                const valorTotal = quantidade * preco;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.movCard,
                      { backgroundColor: isCompra ? '#f1f8f4' : '#fff9f0' },
                    ]}>
                    {/* Header */}
                    <View style={styles.movHeader}>
                      <View
                        style={[
                          styles.movBadge,
                          { backgroundColor: isCompra ? '#2e7d32' : '#e65100' },
                        ]}>
                        <Text style={styles.movBadgeText}>
                          {mov.tipo === 'compra'
                            ? '🟢 COMPRA'
                            : mov.tipo === 'stop loss'
                            ? '🔴 STOP LOSS'
                            : '🔴 TAKE PROFIT'}
                        </Text>
                      </View>
                      <Text style={styles.movNumber}>
                        #{movimentacoesFiltradas.length - idx}
                      </Text>
                    </View>

                    {/* Detalhes */}
                    <View style={styles.movRow}>
                      <Text style={styles.movLabel}>Quantidade:</Text>
                      <Text style={styles.movValue}>
                        {quantidade.toFixed(8)} BTC
                      </Text>
                    </View>

                    <View style={styles.movRow}>
                      <Text style={styles.movLabel}>Preço:</Text>
                      <Text style={styles.movValue}>${preco.toFixed(2)}</Text>
                    </View>

                    <View style={styles.movRow}>
                      <Text style={styles.movLabel}>Total:</Text>
                      <Text
                        style={[
                          styles.movValue,
                          {
                            fontWeight: '700',
                            color: isCompra ? '#2e7d32' : '#e65100',
                            fontSize: 15,
                          },
                        ]}>
                        ${valorTotal.toFixed(2)}
                      </Text>
                    </View>

                    {/* Timestamp */}
                    <View style={styles.movFooter}>
                      <Ionicons name="time-outline" size={12} color="#999" />
                      <Text style={styles.movTimestamp}>
                        {mov.timestamp
                          ? new Date(mov.timestamp).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </Text>
                    </View>
                  </View>
                );
              })
          )}
        </ScrollView>
      )}
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
  // Header e Navegação
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 5,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0066cc',
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0066cc',
  },
  // Estilos para Movimentações
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    color: '#666',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  statMoney: {
    fontSize: 13,
    fontWeight: '700',
  },
  movCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  movHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  movBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  movBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  movNumber: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  movRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  movLabel: {
    fontSize: 13,
    color: '#666',
  },
  movValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  movFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  movTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  filterToggleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filtersCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: '#334155',
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#f8fafc',
  },
  filterOptionActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  filterOptionText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  filterField: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: '#fff',
  },
  clearFilters: {
    backgroundColor: '#64748b',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
