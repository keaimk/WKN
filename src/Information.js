import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Information.css';

function Information() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(1); 
  const [fromCurrency, setFromCurrency] = useState('KRW');
  const [toCurrency, setToCurrency] = useState('JPY');
  const [exchangeRate, setExchangeRate] = useState();
  const [convertedAmount, setConvertedAmount] = useState();

  useEffect(() => {
    fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
      .then((res) => res.json())
      .then((data) => {
        setExchangeRate(data.rates[toCurrency]);
      });
  }, [fromCurrency, toCurrency]);

  // 변환된 금액 계산
  useEffect(() => {
    if (exchangeRate) {
      setConvertedAmount((amount * exchangeRate).toFixed(2));
    }
  }, [exchangeRate, amount]);

  // 통화 변경 핸들러
  const handleCurrencyChange = (e, type) => {
    const currency = e.target.value;
    if (type === 'from') {
      setFromCurrency(currency);
    } else {
      setToCurrency(currency);
    }
  };

  const handleClick = () => {
    navigate('/home');
  };

  return (
    <div>
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
        <img src="/Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <div className="container">
  <div className="fukuoka-embassy-info">
    {/* Fukuoka Embassy Information */}
    <h2>Fukuoka Embassy Information</h2>
    <p><img src="/Address.png" className="address-icon"/><a href="https://www.google.com/maps/search/?api=1&query=후쿠오카 대사관 주소">1-1-3 Jigyohama Chuo-ku Fukuoka-shi, Fukuoka-ken, Japan 810-0065</a></p>
    <p><img src="/HomePage.png" className="homepage-icon"/><a href="https://overseas.mofa.go.kr/jp-fukuoka-ko/index.do">주후쿠오카 대한민국 총영사관</a></p>
    <p><img src="/Email.png" className="email-icon"/><a href="mailto:fukuoka@mofa.go.kr">fukuoka@mofa.go.kr</a></p>
    <p><img src="/Phone.png" className="phone-icon"/><a href="tel:080-8588-2806">080-8588-2806</a></p>
    {/* Currency Converter */}
    <h2>Currency Converter</h2>
    <div className="input-container">
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select value={fromCurrency} onChange={(e) => handleCurrencyChange(e, 'from')} >
        <option value="KRW">KRW</option>
        <option value="JPY">JPY</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="CNY">CNY</option>
      </select>&nbsp; to&nbsp;<select value={toCurrency} onChange={(e) => handleCurrencyChange(e, 'to')} >
        <option value="KRW">KRW</option>
        <option value="JPY">JPY</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="CNY">CNY</option>
      </select>
    </div>
    <div className="result">
      {amount} {fromCurrency} is equal to {convertedAmount} {toCurrency}
      </div>
      </div>
      </div>
      </div>
  );
}

export default Information;