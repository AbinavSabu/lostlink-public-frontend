import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import QrScannerModal from './components/QrScannerModal';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateItem from './pages/CreateItem';
import ItemDetails from './pages/ItemDetails';
import MyItems from './pages/MyItems';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import NotificationCenter from './pages/NotificationCenter';
import Profile from './pages/Profile';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <ScrollToTop />
                    <div className="min-h-screen w-full max-w-full overflow-x-hidden mesh-gradient-bg text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
                        <Navbar />
                        <main className="flex-1">
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/items/:id" element={<ItemDetails />} />

                                {/* Authenticated Routes */}
                                <Route
                                    path="/create-item"
                                    element={
                                        <ProtectedRoute>
                                            <CreateItem />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/my-items"
                                    element={
                                        <ProtectedRoute>
                                            <MyItems />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Admin Routes */}
                                <Route
                                    path="/admin"
                                    element={
                                        <AdminRoute>
                                            <AdminDashboard />
                                        </AdminRoute>
                                    }
                                />
                                <Route
                                    path="/notifications"
                                    element={
                                        <ProtectedRoute>
                                            <NotificationCenter />
                                        </ProtectedRoute>
                                    }
                                />
                            </Routes>
                        </main>
                        <Footer />
                        <CommandPalette />
                        <QrScannerModal />
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}