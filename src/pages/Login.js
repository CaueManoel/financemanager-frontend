import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, senha } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/usuarios/login', {
        email,
        senha,
      });

      console.log('Login bem-sucedido:', response.data);
      
      if (response.data && response.data.id && response.data.nome) {
          localStorage.setItem('userId', response.data.id);
          localStorage.setItem('userName', response.data.nome);
      } else {
          console.warn('Backend não retornou id/nome do usuário no login. Usando mock para teste@teste.com se aplicável.');
          if (email === "teste@teste.com") { 
            localStorage.setItem('userId', '1'); 
            localStorage.setItem('userName', 'Usuário Teste');
            console.log('ID de usuário mockado para teste@teste.com');
          } else if (response.data && (!response.data.id || !response.data.nome)) {
             throw new Error("Resposta do login incompleta do backend.");
          } else {
          }
      }
      
      if (localStorage.getItem('userId')) {
        navigate('/home');
      } else if (! (response.data && response.data.id && response.data.nome) && email !== "teste@teste.com") {
        throw new Error("Falha ao obter ID do usuário após o login.");
      } else if (!localStorage.getItem('userId') && email === "teste@teste.com") {
         throw new Error("Falha ao configurar usuário de teste no localStorage.");
      }


    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 401) {
        setError('Email ou senha inválidos.');
      }
      else if (err.request) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError(err.message || 'Erro ao tentar fazer login. Tente novamente.');
      }
      console.error('Erro no login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.pageContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>
            <span style={styles.titleFinance}>Finance</span>
            <span style={styles.titleManager}>Manager</span>
          </h2>
          {error && <p style={styles.errorMessage}>{error}</p>}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="senha" style={styles.label}>Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={senha}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p style={styles.linkContainer}>
            Não tem uma conta? <Link to="/register" style={styles.link}>Crie uma agora</Link>
          </p>
        </form>
      </div>
    </>
  );
};

const styles = {
    pageContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
    },
    form: {
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        boxSizing: 'border-box',
    },
    title: {
        marginBottom: '24px',
        color: '#333',
        fontSize: '24px',
        textAlign: 'center',
    },
    titleFinance: {
        color: '#4F4F4F',
    },
    titleManager: {
        color: '#9ACD32',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#555',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxSizing: 'border-box',
        fontSize: '16px',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#9ACD32',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    },
    errorMessage: {
        color: 'red',
        marginBottom: '15px',
        textAlign: 'center',
        fontSize: '14px',
    },
    linkContainer: {
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '14px',
    },
    link: {
        color: '#9ACD32',
        textDecoration: 'none',
    },
};

export default Login;