import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import './index.css';
import React from 'react';
import ProductsPage from "./components/Product.jsx";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/product" element={<ProductsPage/>} />
            </Routes>
        </Router>
    );
}

export default App;
