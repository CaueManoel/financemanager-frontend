import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { nome, email, senha } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Definir loading no início do submit

    if (!nome.trim()) {
      setError('Por favor, informe seu nome.');
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError('Por favor, informe seu email.');
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, insira um email válido.');
      setLoading(false);
      return;
    }
    if (!senha) {
      setError('Por favor, informe sua senha.');
      setLoading(false);
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        nome,
        email,
        senha,
      };
      const response = await apiClient.post('/usuarios/register', payload); 
      
      console.log('Usuário registrado:', response.data);
      alert('Registro realizado com sucesso! Você será redirecionado para o login.');
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.data && typeof err.response.data === 'string' && err.response.data.includes("Email já cadastrado")) {
        setError("Este email já está cadastrado. Tente outro.");
      } else if (err.request) {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está rodando.');
      } else {
        setError('Erro ao registrar. Tente novamente mais tarde.');
      }
      console.error('Erro no registro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.registerContainer}>
        <form onSubmit={handleSubmit} style={styles.registerForm}>
          <h2 style={styles.title}>Cadastro</h2>
          {error && <p style={styles.errorMessage}>{error}</p>}
          <div style={styles.formGroup}>
            <label htmlFor="nome" style={styles.label}>Nome</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={nome}
              onChange={handleChange}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
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
              minLength="6"
            />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
          <p style={styles.loginLinkContainer}>
            Já tem uma conta? <Link to="/" style={styles.loginLink}>Faça Login</Link>
          </p>
        </form>
      </div>
    </>
  );
};

const styles = {
  registerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  registerForm: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  title: {
    marginBottom: '22px',
    color: '#333',
    fontSize: '24px',
    textAlign: 'center',
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
  loginLinkContainer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
  },
  loginLink: {
    color: '#9ACD32',
    textDecoration: 'none',
  },
};

export default Register;