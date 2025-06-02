import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Adicionado useLocation
import apiClient from '../api/axiosConfig';

const determineStatus = (valorInput, pagoInput) => {
  const val = parseFloat(valorInput);
  const pag = parseFloat(pagoInput);

  if (isNaN(val) || val <= 0) {
    return "PENDENTE";
  }
  if (isNaN(pag) || pag < 0) {
    return "PENDENTE";
  }
  if (val === pag) {
    return "PAGO";
  }
  return "PENDENTE";
};

const createInitialDespesaRow = (tempId) => ({
  id: null,
  tempId: tempId || `temp-${Date.now()}-${Math.random()}`,
  venc: '',
  descricao: '',
  cartao: '',
  valor: '',
  pago: '',
  parcelas: '',
  status: determineStatus('', ''),
  tipo: 'despesa',
});

const createInitialReceitaCatRow = (tempId) => ({
  id: null,
  tempId: tempId || `temp-${Date.now()}-${Math.random()}`,
  descricao: '',
  valor: '',
  status: '',
});

const getInitialDataStructure = () => ({
  transacoesDoMes: Array.from({ length: 10 }, (_, i) => createInitialDespesaRow(`despesa_temp_${i}`)),
  resumoReceitasCategorias: Array.from({ length: 5 }, (_, i) => createInitialReceitaCatRow(`receita_temp_${i}`)),
});

const mesesDoAno = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const formatCurrency = (value) => {
  const num = Number(value);
  if (typeof num !== 'number' || isNaN(num)) {
    return 'R$ 0,00';
  }
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};

const getAnoFromUrl = (search) => {
  const params = new URLSearchParams(search);
  const anoParam = params.get('ano');
  if (anoParam) {
    const ano = parseInt(anoParam, 10);
    if (!isNaN(ano) && ano > 1900 && ano < 2300) {
      return ano;
    }
  }
  return new Date().getFullYear();
};

const getMesIndexFromUrl = (search) => {
  const params = new URLSearchParams(search);
  const mesParam = params.get('mes');
  if (mesParam) {
    const mes = parseInt(mesParam, 10);
    if (!isNaN(mes) && mes >= 1 && mes <= 12) {
      return mes - 1;
    }
  }
  return new Date().getMonth();
};


const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [anoAtual, setAnoAtual] = useState(() => getAnoFromUrl(location.search));
  const [mesAtualIndex, setMesAtualIndex] = useState(() => getMesIndexFromUrl(location.search));
  
  const [dadosDoMes, setDadosDoMes] = useState(getInitialDataStructure());
  const [pageLoading, setPageLoading] = useState(true);
  const [itemLoading, setItemLoading] = useState({});
  const [error, setError] = useState('');

  const nomeMesAtualDisplay = `${mesesDoAno[mesAtualIndex]}`;
  const userId = localStorage.getItem('userId');

  const fetchDados = useCallback(async () => {
    if (!userId) {
      setError("Usuário não autenticado. Faça o login.");
      setPageLoading(false);
      navigate('/');
      return;
    }
    setPageLoading(true);
    setError('');
    try {
      const mesParaAPI = mesAtualIndex + 1;
      const params = {
        mes: mesParaAPI
      };

      const [despesasResponse, receitasResponse] = await Promise.all([
        apiClient.get(`/usuarios/${userId}/despesas`, { params }),
        apiClient.get(`/usuarios/${userId}/receitas`, { params })
      ]);

      const fetchedDespesas = despesasResponse.data || [];
      const fetchedReceitas = receitasResponse.data || [];
      const initialStructure = getInitialDataStructure();

      setDadosDoMes({
        transacoesDoMes: [
          ...fetchedDespesas.map(d => {
            const valor = d.valor;
            const valorPago = d.valorPago;
            return {
              ...d,
              venc: d.dataVencimento !== null && d.dataVencimento !== undefined ? String(d.dataVencimento) : '',
              pago: valorPago !== null && valorPago !== undefined ? String(valorPago) : '',
              valor: valor !== null && valor !== undefined ? String(valor) : '',
              descricao: d.descricao || '',
              parcelas: d.parcelas || '',
              status: determineStatus(valor, valorPago),
              tempId: d.id
            };
          }),
          ...initialStructure.transacoesDoMes.slice(fetchedDespesas.length)
        ].slice(0, 50),
        resumoReceitasCategorias: [
          ...fetchedReceitas.map(r => ({
            ...r,
            valor: r.valor !== null && r.valor !== undefined ? String(r.valor) : '',
            descricao: r.descricao || '',
            tempId: r.id
          })),
          ...initialStructure.resumoReceitasCategorias.slice(fetchedReceitas.length)
        ].slice(0, 20),
        resumoInvestimentos: initialStructure.resumoInvestimentos
      });

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Falha ao carregar dados financeiros.");
      setDadosDoMes(getInitialDataStructure());
    } finally {
      setPageLoading(false);
    }
  }, [userId, mesAtualIndex, anoAtual, navigate]);

  useEffect(() => {
    setAnoAtual(getAnoFromUrl(location.search));
    setMesAtualIndex(getMesIndexFromUrl(location.search));
  }, [location.search]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const updateUrlAndState = (novoAno, novoMesIndex) => {
    setAnoAtual(novoAno);
    setMesAtualIndex(novoMesIndex);
    navigate(`${location.pathname}?ano=${novoAno}&mes=${novoMesIndex + 1}`, { replace: true });
  };

  const handleMesAnterior = () => {
    let novoAno = anoAtual;
    let novoMesIndex = mesAtualIndex - 1;
    if (novoMesIndex < 0) {
      novoMesIndex = 11;
      novoAno = anoAtual - 1;
    }
    updateUrlAndState(novoAno, novoMesIndex);
  };

  const handleMesProximo = () => {
    let novoAno = anoAtual;
    let novoMesIndex = mesAtualIndex + 1;
    if (novoMesIndex > 11) {
      novoMesIndex = 0;
      novoAno = anoAtual + 1;
    }
    updateUrlAndState(novoAno, novoMesIndex);
  };

  const handleInputChange = (tempId, field, value, section) => {
    setDadosDoMes(prevDados => ({
      ...prevDados,
      [section]: prevDados[section].map(item => {
        if (item.tempId === tempId) {
          let processedValue = value;

          if (field === 'descricao') {
            processedValue = value.toUpperCase();
          } else if (field === 'valor' || field === 'pago') {
            if (value === '') {
              processedValue = '';
            } else {
              const parsed = parseFloat(value);
              processedValue = isNaN(parsed) ? '' : parsed;
            }
          } else if (field === 'parcelas') {
            processedValue = value;
          }

          const updatedItem = { ...item, [field]: processedValue };

          if (section === 'transacoesDoMes' && (field === 'valor' || field === 'pago')) {
            const currentValor = (field === 'valor') ? processedValue : updatedItem.valor;
            const currentPago = (field === 'pago') ? processedValue : updatedItem.pago;
            updatedItem.status = determineStatus(currentValor, currentPago);
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleItemSave = async (tempId, section) => {
    if (!userId) return;
    const itemIndex = dadosDoMes[section].findIndex(i => i.tempId === tempId);
    if (itemIndex === -1) return;

    const item = dadosDoMes[section][itemIndex];

    if (!item.id &&
      ((section === 'transacoesDoMes' && (!item.descricao?.trim() || item.valor === '' || item.valor === 0)) ||
        (section === 'resumoReceitasCategorias' && (!item.descricao?.trim() || item.valor === '' || item.valor === 0)))) {
      return;
    }

    setItemLoading(prev => ({ ...prev, [tempId]: true }));
    setError('');

    const isNewItem = !item.id;
    let endpoint = '';
    let method = '';
    let payload = { ...item };

    delete payload.tempId;

    if (isNewItem) {
      payload.mes = mesAtualIndex + 1;
      payload.ano = anoAtual; 
    }


    if (section === 'transacoesDoMes') {
      const vencValue = String(item.venc || '').trim();
      if (vencValue === '') {
        setError('O dia de vencimento é obrigatório.');
        setItemLoading(prev => ({ ...prev, [tempId]: false }));
        return;
      }
      const vencAsInt = parseInt(vencValue, 10);
      if (isNaN(vencAsInt) || vencAsInt <= 0 || vencAsInt > 31) {
        setError('O dia de vencimento deve ser um número válido entre 1 e 31.');
        setItemLoading(prev => ({ ...prev, [tempId]: false }));
        return;
      }
      payload.dataVencimento = vencAsInt;
      delete payload.venc;

      if (typeof item.valor === 'number' && !isNaN(item.valor) && item.valor > 0) {
        payload.valor = item.valor;
      } else if (item.valor === '' || item.valor === null || item.valor === undefined || parseFloat(String(item.valor)) <= 0) {
        setError('O valor da despesa é obrigatório e deve ser maior que zero.');
        setItemLoading(prev => ({ ...prev, [tempId]: false }));
        return;
      } else {
        const valorAsFloat = parseFloat(String(item.valor));
        if (isNaN(valorAsFloat) || valorAsFloat <= 0) {
          setError('Valor da despesa inválido ou não é maior que zero.');
          setItemLoading(prev => ({ ...prev, [tempId]: false }));
          return;
        }
        payload.valor = valorAsFloat;
      }

      if (typeof item.pago === 'number' && !isNaN(item.pago)) {
        payload.valorPago = item.pago;
      } else if (item.pago === '' || item.pago === null || item.pago === undefined) {
        payload.valorPago = null;
      } else {
        const pagoAsFloat = parseFloat(String(item.pago));
        if (isNaN(pagoAsFloat)) {
          setError('Valor pago inválido. Deve ser um número ou vazio.');
          setItemLoading(prev => ({ ...prev, [tempId]: false }));
          return;
        }
        payload.valorPago = pagoAsFloat;
      }
      delete payload.pago;

      payload.parcelas = String(item.parcelas || '').trim();

      payload.status = determineStatus(payload.valor, payload.valorPago);
      endpoint = isNewItem ? `/usuarios/${userId}/despesas` : `/usuarios/${userId}/despesas/${item.id}`;
      method = isNewItem ? 'post' : 'put';

    } else if (section === 'resumoReceitasCategorias') {
      const descReceita = String(item.descricao || '').trim();
      if (descReceita === '') {
        setError('A descrição da receita é obrigatória.');
        setItemLoading(prev => ({ ...prev, [tempId]: false }));
        return;
      }
      payload.descricao = descReceita;

      if (typeof item.valor === 'number' && !isNaN(item.valor) && item.valor > 0) {
        payload.valor = item.valor;
      } else if (item.valor === '' || item.valor === null || item.valor === undefined || parseFloat(String(item.valor)) <= 0) {
        setError('O valor da receita é obrigatório e deve ser maior que zero.');
        setItemLoading(prev => ({ ...prev, [tempId]: false }));
        return;
      } else {
        const valorReceitaFloat = parseFloat(String(item.valor));
        if (isNaN(valorReceitaFloat) || valorReceitaFloat <= 0) {
          setError('Valor da receita inválido ou não é maior que zero.');
          setItemLoading(prev => ({ ...prev, [tempId]: false }));
          return;
        }
        payload.valor = valorReceitaFloat;
      }
      payload.status = String(item.status || '').trim();
      endpoint = isNewItem ? `/usuarios/${userId}/receitas` : `/usuarios/${userId}/receitas/${item.id}`;
      method = isNewItem ? 'post' : 'put';
    }

    if (!endpoint) {
      setItemLoading(prev => ({ ...prev, [tempId]: false }));
      return;
    }

    console.log("Enviando para o backend (payload):", JSON.stringify(payload, null, 2));

    try {
      await apiClient[method](endpoint, payload);
      window.location.reload();
    } catch (err) {
      console.error(`Erro ao salvar item na seção ${section}:`, err);
      const backendError = err.response?.data?.message || err.response?.data?.error;
      setError(backendError || `Falha ao salvar ${section === 'transacoesDoMes' ? 'despesa' : 'receita'}. Verifique os dados.`);
      setItemLoading(prev => ({ ...prev, [tempId]: false }));
    }
  };

  const handleItemDelete = async (itemId, section, tempId) => {
    if (!userId || !itemId) {
      if (tempId) {
        setDadosDoMes(prevDados => ({
          ...prevDados,
          [section]: prevDados[section].map(i =>
            i.tempId === tempId ? (section === 'transacoesDoMes' ? createInitialDespesaRow(tempId) : createInitialReceitaCatRow(tempId)) : i
          )
        }));
      }
      return;
    }

    setItemLoading(prev => ({ ...prev, [tempId]: true }));
    setError('');
    let endpoint = '';
    if (section === 'transacoesDoMes') {
      endpoint = `/usuarios/${userId}/despesas/${itemId}`;
    } else if (section === 'resumoReceitasCategorias') {
      endpoint = `/usuarios/${userId}/receitas/${itemId}`;
    }

    if (!endpoint) {
      setItemLoading(prev => ({ ...prev, [tempId]: false }));
      return;
    }

    try {
      await apiClient.delete(endpoint);
      window.location.reload();
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      setError(`Falha ao deletar ${section === 'transacoesDoMes' ? 'despesa' : 'receita'}.`);
      setItemLoading(prev => ({ ...prev, [tempId]: false }));
    }
  };

  const { transacoesDoMes, resumoReceitasCategorias, resumoInvestimentos } = dadosDoMes;
  const totalReceitasCalculado = resumoReceitasCategorias.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const totalDespesasCalculado = transacoesDoMes.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const saldoCalculado = totalReceitasCalculado - totalDespesasCalculado;

  if (pageLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '20px' }}>Carregando dados...</div>;
  }

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <span style={styles.logoFinance}>Finance</span>
          <span style={styles.logoManager}>Manager</span>
        </div>
        <div style={styles.monthSelector}>
          <button onClick={handleMesAnterior} style={styles.monthButton}>&lt;</button>
          <span style={styles.currentMonth}>{nomeMesAtualDisplay}</span>
          <button onClick={handleMesProximo} style={styles.monthButton}>&gt;</button>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </header>

      <div style={styles.contentArea}>
        {error && <p style={{ color: 'red', textAlign: 'center', padding: '10px', backgroundColor: '#ffebee', border: '1px solid red', borderRadius: '4px' }}>{error}</p>}

        <div style={styles.summaryCardsContainer}>
          <div style={{ ...styles.summaryCard, backgroundColor: '#e6f7ff' }}>
            <h3 style={styles.cardTitle}>Total Receitas ({nomeMesAtualDisplay})</h3>
            <p style={{ ...styles.cardValue, color: '#007bff' }}>{formatCurrency(totalReceitasCalculado)}</p>
          </div>
          <div style={{ ...styles.summaryCard, backgroundColor: '#fff0f0' }}>
            <h3 style={styles.cardTitle}>Total Despesas ({nomeMesAtualDisplay})</h3>
            <p style={{ ...styles.cardValue, color: '#dc3545' }}>{formatCurrency(totalDespesasCalculado)}</p>
          </div>
          <div style={{ ...styles.summaryCard, backgroundColor: '#e6ffed' }}>
            <h3 style={styles.cardTitle}>Saldo ({nomeMesAtualDisplay})</h3>
            <p style={{ ...styles.cardValue, color: saldoCalculado >= 0 ? '#28a745' : '#dc3545' }}>{formatCurrency(saldoCalculado)}</p>
          </div>
        </div>

        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Despesas de {nomeMesAtualDisplay}</h2>
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: '5%' }}>Venc.</th>
                  <th style={{ ...styles.th, width: '30%' }}>Descrição</th>
                  <th style={{ ...styles.th, width: '15%' }}>Valor</th>
                  <th style={{ ...styles.th, width: '10%' }}>Pago</th>
                  <th style={{ ...styles.th, width: '10%' }}>N° Parc.</th>
                  <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>Status</th>
                  <th style={{ ...styles.th, width: '5%', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {transacoesDoMes.map((item) => (
                  <tr key={item.tempId} style={itemLoading[item.tempId] ? styles.rowLoading : styles.despesaRow}>
                    <td style={styles.td}><input type="text" value={item.venc} onChange={(e) => handleInputChange(item.tempId, 'venc', e.target.value, 'transacoesDoMes')} onBlur={() => handleItemSave(item.tempId, 'transacoesDoMes')} style={styles.editableInput} /></td>
                    <td style={styles.td}><input type="text" value={item.descricao} onChange={(e) => handleInputChange(item.tempId, 'descricao', e.target.value, 'transacoesDoMes')} onBlur={() => handleItemSave(item.tempId, 'transacoesDoMes')} style={styles.editableInput} /></td>
                    <td style={styles.td}><input type="number" value={item.valor} onChange={(e) => handleInputChange(item.tempId, 'valor', e.target.value, 'transacoesDoMes')} onBlur={() => handleItemSave(item.tempId, 'transacoesDoMes')} style={{ ...styles.editableInput, color: '#dc3545' }} placeholder="0.00" step="0.01" /></td>
                    <td style={styles.td}><input type="number" value={item.pago} onChange={(e) => handleInputChange(item.tempId, 'pago', e.target.value, 'transacoesDoMes')} onBlur={() => handleItemSave(item.tempId, 'transacoesDoMes')} style={{ ...styles.editableInput, color: '#228B22' }} placeholder="0.00" step="0.01" /></td>
                    <td style={styles.td}><input type="text" value={item.parcelas} onChange={(e) => handleInputChange(item.tempId, 'parcelas', e.target.value, 'transacoesDoMes')} onBlur={() => handleItemSave(item.tempId, 'transacoesDoMes')} style={styles.editableInput} /></td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <input
                        type="text"
                        value={item.status}
                        style={{
                          ...styles.editableInput,
                          color: item.status === 'PAGO' ? 'green' : item.status === 'PENDENTE' ? 'red' : styles.editableInput.color || 'inherit',
                          fontWeight: 'bold', textAlign: 'center'
                        }}
                        readOnly
                      />
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleItemDelete(item.id, 'transacoesDoMes', item.tempId)}
                        style={styles.deleteButton}
                        disabled={itemLoading[item.tempId]}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ ...styles.td, ...styles.footerCell, textAlign: 'right' }}><strong>TOTAL DESPESAS:</strong></td>
                  <td style={{ ...styles.td, ...styles.footerCell, color: '#dc3545' }}><strong>{formatCurrency(totalDespesasCalculado)}</strong></td>
                  <td colSpan="3" style={{ ...styles.td, ...styles.footerCell }}></td> 
                </tr>
                <tr>
                  <td colSpan="4" style={{ ...styles.td, ...styles.footerCell, textAlign: 'right' }}><strong>SALDO GERAL:</strong></td>
                  <td style={{ ...styles.td, ...styles.footerCell, color: saldoCalculado >= 0 ? '#28a745' : '#dc3545' }}><strong>{formatCurrency(saldoCalculado)}</strong></td>
                  <td colSpan="3" style={{ ...styles.td, ...styles.footerCell }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style={styles.bottomSectionsContainer}>
          <div style={{ ...styles.sectionContainer, ...styles.bottomSection }}>
            <h2 style={styles.sectionTitle}>Fontes de Receita ({nomeMesAtualDisplay})</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: '40%' }}>Fonte</th>
                  <th style={{ ...styles.th, width: '29%' }}>Valor Previsto/Recebido</th>
                  <th style={{ ...styles.th, width: '25%', textAlign: 'center' }}>Status</th>
                  <th style={{ ...styles.th, width: '6%', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {resumoReceitasCategorias.map((item) => (
                  <tr key={item.tempId} style={itemLoading[item.tempId] ? styles.rowLoading : {}}>
                    <td style={styles.td}><input type="text" value={item.descricao} onChange={(e) => handleInputChange(item.tempId, 'descricao', e.target.value, 'resumoReceitasCategorias')} onBlur={() => handleItemSave(item.tempId, 'resumoReceitasCategorias')} style={styles.editableInput} /></td>
                    <td style={styles.td}><input type="number" value={item.valor} onChange={(e) => handleInputChange(item.tempId, 'valor', e.target.value, 'resumoReceitasCategorias')} onBlur={() => handleItemSave(item.tempId, 'resumoReceitasCategorias')} style={{ ...styles.editableInput, color: '#28a745' }} placeholder="0.00" step="0.01" /></td>
                    <td style={{ ...styles.td, textAlign: 'center' }}><input type="text" value={item.status} onChange={(e) => handleInputChange(item.tempId, 'status', e.target.value, 'resumoReceitasCategorias')} onBlur={() => handleItemSave(item.tempId, 'resumoReceitasCategorias')} style={{ ...styles.editableInput, textAlign: 'center' }} /></td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleItemDelete(item.id, 'resumoReceitasCategorias', item.tempId)}
                        style={styles.deleteButton}
                        disabled={itemLoading[item.tempId]}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...styles.td, ...styles.footerCell }}><strong>TOTAL RECEITAS (FONTES):</strong></td>
                  <td style={{ ...styles.td, ...styles.footerCell, color: '#28a745' }}><strong>{formatCurrency(resumoReceitasCategorias.reduce((acc, i) => acc + Number(i.valor || 0), 0))}</strong></td>
                  <td colSpan="2" style={{ ...styles.td, ...styles.footerCell }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: { fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 },
  logoContainer: { fontSize: '24px', fontWeight: 'bold' },
  logoFinance: { color: '#28a745' },
  logoManager: { color: '#333333' },
  monthSelector: { display: 'flex', alignItems: 'center' },
  monthButton: { background: 'none', border: '1px solid #ccc', padding: '5px 10px', cursor: 'pointer', fontSize: '16px', margin: '0 10px', borderRadius: '4px' },
  currentMonth: { fontSize: '18px', fontWeight: 'bold', color: '#007bff', minWidth: '150px', textAlign: 'center' },
  logoutButton: { padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  contentArea: { padding: '20px' },
  summaryCardsContainer: { display: 'flex', justifyContent: 'space-around', marginBottom: '30px', gap: '20px', flexWrap: 'wrap' },
  summaryCard: { padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, minWidth: '220px', textAlign: 'center' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '16px', color: '#555' },
  cardValue: { margin: 0, fontSize: '24px', fontWeight: 'bold' },
  sectionContainer: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px' },
  sectionTitle: { color: '#007bff', marginBottom: '15px', borderBottom: '2px solid #007bff', paddingBottom: '5px', fontSize: '20px' },
  tableResponsive: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#007bff', color: 'white', padding: '10px 12px', textAlign: 'left', border: '1px solid #ddd', fontSize: '14px' },
  td: { padding: '2px', border: '1px solid #ddd', textAlign: 'left', fontSize: '14px', verticalAlign: 'middle' },
  editableInput: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', minHeight: '38px', backgroundColor: '#fff', textTransform: 'uppercase', },
  rowLoading: {
    pointerEvents: 'none'
  },
  despesaRow: {},
  deleteButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc3545',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0px 5px',
    lineHeight: '1'
  },
  footerCell: { backgroundColor: '#f0f0f0', fontWeight: 'bold', padding: '10px 12px' },
  bottomSectionsContainer: { display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' },
  bottomSection: { flex: 1, minWidth: 'calc(50% - 10px)' }
};

export default Home;