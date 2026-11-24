import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { Products } from '../pages/Products';
import { Expiration } from '../pages/Expiration';
import { Replenishment } from '../pages/Replenishment';
import { Alerts } from '../pages/Alerts';
import { Import } from '../pages/Import';
import { Assistant } from '../pages/Assistant';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/produtos/:id" element={<Products />} />
        <Route path="/vencimentos" element={<Expiration />} />
        <Route path="/reposicao" element={<Replenishment />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/importar" element={<Import />} />
        <Route path="/assistente" element={<Assistant />} />
      </Route>
    </Routes>
  );
}

export default App;