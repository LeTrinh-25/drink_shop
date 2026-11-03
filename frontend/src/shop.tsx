import { FormEvent, useEffect, useMemo, useState } from 'react';

type Product = { id: number; name: string; price: number; image?: string; description?: string; category?: { id: number; name: string } };
type Category = { id: number; name: string };
type User = { id: number; username: string; fullName?: string; role: string };
type CartItem = { id: number; product_id: number; quantity: number; product: Product };
type Cart = { items: CartItem[]; total: number };

const fallbackProducts: Product[] = [
  ['7Up', 12000, '7up.jpg', 'Nước ngọt', 'Nước ngọt có gas vị chanh tươi mát.'],
  ['Aquafina 500ml', 8000, 'aquafina.jpg', 'Nước suối', 'Nước uống tinh khiết đóng chai 500ml.'],
  ['Bạc xỉu', 28000, 'bac-xiu.jpg', 'Cà phê', 'Cà phê sữa dịu nhẹ, thơm béo.'],
  ['Cà phê đen', 22000, 'cafe-den.jpg', 'Cà phê', 'Cà phê đen đậm vị, thơm đặc trưng.'],
  ['Cà phê sữa', 26000, 'cafe-sua.jpg', 'Cà phê', 'Cà phê hòa quyện cùng sữa ngọt béo.'],
  ['Coca-Cola', 12000, 'coca.jpg', 'Nước ngọt', 'Nước ngọt có gas Coca-Cola mát lạnh.'],
  ['Nước ép cam', 30000, 'ep-cam.jpg', 'Nước ép', 'Nước ép cam vị chua ngọt tự nhiên.'],
  ['Nước ép dứa', 28000, 'ep-dua.jpg', 'Nước ép', 'Nước ép dứa thơm ngon, giải khát.'],
  ['Nước ép ổi', 28000, 'ep-oi.jpg', 'Nước ép', 'Nước ép ổi thơm nhẹ, vị ngọt thanh.'],
  ['Fanta cam', 12000, 'fanta.jpg', 'Nước ngọt', 'Nước ngọt có gas vị cam.'],
  ['Heineken', 22000, 'heineken.jpg', 'Bia', 'Bia Heineken ướp lạnh.'],
  ['Bia Huda', 16000, 'huda.jpg', 'Bia', 'Bia Huda đậm đà, mát lạnh.'],
  ['Bia Larue', 16000, 'larue.jpg', 'Bia', 'Bia Larue sảng khoái.'],
  ['LaVie 500ml', 8000, 'lavie.jpg', 'Nước suối', 'Nước khoáng thiên nhiên đóng chai 500ml.'],
  ['Pepsi', 12000, 'pepsi.jpg', 'Nước ngọt', 'Nước ngọt có gas Pepsi mát lạnh.'],
  ['Rượu vang đỏ', 280000, 'ruou-vang.jpg', 'Rượu', 'Rượu vang đỏ dùng trong những dịp đặc biệt.'],
  ['Bia Saigon', 16000, 'saigon.jpg', 'Bia', 'Bia Saigon ướp lạnh, dễ uống.'],
  ['Soju', 95000, 'soju.jpg', 'Rượu', 'Rượu Soju phong cách Hàn Quốc.'],
  ['Sữa socola', 18000, 'sua-socola.jpg', 'Sữa', 'Sữa vị socola thơm ngon.'],
  ['Sữa tươi', 16000, 'sua-tuoi.jpg', 'Sữa', 'Sữa tươi mát lành, dễ uống.'],
  ['Trà chanh', 22000, 'tra-chanh.jpg', 'Trà & trà sữa', 'Trà chanh chua ngọt, giải khát.'],
  ['Trà đào', 28000, 'tra-dao.jpg', 'Trà & trà sữa', 'Trà đào thơm dịu, vị ngọt thanh.'],
  ['Trà sữa', 32000, 'tra-sua.jpg', 'Trà & trà sữa', 'Trà sữa béo thơm, pha mới mỗi ngày.'],
  ['Tiger', 19000, 'tiger.jpg', 'Bia', 'Bia Tiger ướp lạnh.'],
].map(([name, price, image, category, description], index) => ({
  id: -(index + 1), name: String(name), price: Number(price), image: String(image),
  description: String(description), category: { id: -(index + 1), name: String(category) },
}));
const fallbackCategories: Category[] = Array.from(new Set(fallbackProducts.map((p) => p.category!.name)))
  .map((name, index) => ({ id: -(index + 1), name }));

const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const imageUrl = (image?: string) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  const path = image.startsWith('/') ? image : `/images/${image}`;
  return path;
};
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Có lỗi xảy ra');
  return data as T;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [view, setView] = useState('shop');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (category) params.set('category', category);
      const data = await api<{ products: Product[]; categories: Category[] }>(`/products?${params}`);
      if (!data.products?.length) {
        const keyword = search.trim().toLocaleLowerCase('vi');
        setProducts(fallbackProducts.filter((p) => (!category || String(p.category?.id) === category) &&
          (!keyword || `${p.name} ${p.description} ${p.category?.name}`.toLocaleLowerCase('vi').includes(keyword))));
        setCategories(fallbackCategories);
        setUsingFallback(true);
      } else {
        setProducts(data.products); setCategories(data.categories); setUsingFallback(false);
      }
    } catch {
      const keyword = search.trim().toLocaleLowerCase('vi');
      setProducts(fallbackProducts.filter((p) => (!category || String(p.category?.id) === category) &&
        (!keyword || `${p.name} ${p.description} ${p.category?.name}`.toLocaleLowerCase('vi').includes(keyword))));
      setCategories(fallbackCategories);
      setUsingFallback(true);
    }
  };
  const loadUser = async () => {
    try {
      const data = await api<{ user: User | null }>('/auth/me'); setUser(data.user);
      if (data.user) await loadCart();
    } catch {
      setUser(null);
      setCart({ items: [], total: 0 });
    }
  };
  const loadCart = async () => { try { setCart(await api<Cart>('/cart')); } catch { setCart({ items: [], total: 0 }); } };

  useEffect(() => { void loadUser(); }, []);
  useEffect(() => { void loadProducts(); }, [category]);
  useEffect(() => { const timer = window.setTimeout(() => void loadProducts(), 250); return () => window.clearTimeout(timer); }, [search]);

  const count = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setNotice('');
    try { await action(); } catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  };
  const add = (productId: number) => run(async () => {
    await api('/cart/items', { method: 'POST', body: JSON.stringify({ productId }) });
    await loadCart(); setNotice('Đã thêm vào giỏ hàng');
  });
  const submitAuth = (event: FormEvent<HTMLFormElement>, mode: 'login' | 'register') => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) });
        setNotice('Tạo tài khoản thành công. Bạn có thể đăng nhập.'); setView('login'); return;
      }
      const data = await api<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) });
      setUser(data.user); await loadCart(); setView('shop'); setNotice('Đăng nhập thành công');
    });
  };
  const checkout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void run(async () => {
      const data = await api<{ order: { id: number; total: number } }>('/orders', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) });
      setCart({ items: [], total: 0 }); setView('shop'); setNotice(`Đặt hàng thành công · Mã đơn #${data.order.id}`);
    });
  };
  const logout = () => run(async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); setCart({ items: [], total: 0 }); setView('shop'); });

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#" onClick={() => setView('shop')}><span className="brand-mark">D</span><span>drink<span className="brand-light">shop</span><small>GOOD DRINKS, GOOD DAYS</small></span></a>
      <nav><button className={view === 'shop' ? 'nav-link active' : 'nav-link'} onClick={() => setView('shop')}>Cửa hàng</button><button className="nav-link" onClick={() => setView(user ? 'cart' : 'login')}>Giỏ hàng <span className="cart-count">{count}</span></button></nav>
      <div className="account">{user ? <><span className="welcome">Xin chào, {user.fullName || user.username}</span><button className="text-button" onClick={() => void logout()}>Đăng xuất</button></> : <><button className="text-button" onClick={() => setView('login')}>Đăng nhập</button><button className="button button-dark button-small" onClick={() => setView('register')}>Tạo tài khoản</button></>}</div>
    </header>
    {view === 'shop' && <main><section className="hero"><div className="hero-copy"><span className="eyebrow">TỪ QUẦY PHA ĐẾN TẬN TAY</span><h1>Một ngụm<br/><em>vui mỗi ngày.</em></h1><p>Chọn món bạn yêu thích. Chúng mình chuẩn bị thật chỉn chu và giao đến bạn.</p><button className="button button-lime" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>Khám phá menu <span>↘</span></button></div><div className="hero-art"><div className="sun"></div><div className="drink-cup"><div className="straw"></div><div className="cup-lid"></div><div className="cup-body"><div className="cup-foam"></div><span>GOOD<br/>MOOD</span></div></div><div className="art-caption">FRESHLY MADE<br/><b>JUST FOR YOU</b></div><span className="sparkle sparkle-one">✳</span><span className="sparkle sparkle-two">✳</span></div></section>
      <section id="menu" className="menu-section"><div className="section-heading"><div><span className="eyebrow">LỰA CHỌN CỦA BẠN</span><h2>Menu hôm nay</h2></div><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm món yêu thích" /></label></div>
        <div className="filters"><button className={!category ? 'chip selected' : 'chip'} onClick={() => setCategory('')}>Tất cả</button>{categories.map(c => <button key={c.id} className={category === String(c.id) ? 'chip selected' : 'chip'} onClick={() => setCategory(String(c.id))}>{c.name}</button>)}</div>
        {usingFallback && <p className="catalog-note">Đang hiển thị menu mẫu. Các chức năng đặt hàng sẽ hoạt động khi máy chủ kết nối lại.</p>}
        {products.length ? <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product.id}><div className={`product-image image-${index % 4}`}>{product.image ? <img src={imageUrl(product.image)} alt={product.name}/> : <span className="cup-emoji">🥤</span>}<span className="category-tag">{product.category?.name || 'Món ngon'}</span></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.description || 'Pha mới mỗi ngày, dành riêng cho bạn.'}</p></div><strong>{money(product.price)}</strong></div><button className="detail-button" onClick={() => setSelectedProduct(product)}>Xem chi ti?t</button><button disabled={busy || usingFallback} className="add-button" onClick={() => user ? void add(product.id) : setView('login')}>{usingFallback ? 'Máy chủ đang tạm ngưng' : <>Thêm vào giỏ <span>＋</span></>}</button></article>)}</div> : <div className="empty-state">Chưa tìm thấy món phù hợp. Thử từ khóa khác nhé.</div>}
      </section></main>}
    {(view === 'login' || view === 'register') && <main className="form-wrap"><div className="form-aside"><span className="eyebrow">RẤT VUI ĐƯỢC GẶP BẠN</span><h1>Niềm vui<br/><em>đang chờ.</em></h1><p>Đăng nhập để lưu giỏ hàng và đặt món yêu thích nhanh hơn.</p><span className="big-cup">🥤</span></div><form className="panel form-panel" onSubmit={e => submitAuth(e, view as 'login' | 'register')}><span className="eyebrow">TÀI KHOẢN DRINKSHOP</span><h2>{view === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2><label>Tên đăng nhập<input name="username" autoComplete="username" required /></label><label>Mật khẩu<input name="password" type="password" minLength={6} autoComplete={view === 'login' ? 'current-password' : 'new-password'} required /></label><button disabled={busy} className="button button-dark full">{view === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button><p className="switch-form">{view === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <button type="button" className="text-button" onClick={() => setView(view === 'login' ? 'register' : 'login')}>{view === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}</button></p></form></main>}
    {view === 'cart' && <main className="content-page"><span className="eyebrow">GIỎ HÀNG CỦA BẠN</span><h1>Chọn rồi thì <em>thưởng thức.</em></h1>{cart.items.length ? <div className="cart-layout"><div className="panel cart-list">{cart.items.map(item => <div className="cart-row" key={item.id}><img src={imageUrl(item.product.image)} alt=""/><div className="cart-name"><b>{item.product.name}</b><small>{money(item.product.price)}</small></div><div className="quantity"><button onClick={() => void run(async () => { await api(`/cart/items/${item.id}`, { method: 'PUT', body: JSON.stringify({ quantity: Math.max(1, item.quantity - 1) }) }); await loadCart(); })}>−</button><span>{item.quantity}</span><button onClick={() => void run(async () => { await api(`/cart/items/${item.id}`, { method: 'PUT', body: JSON.stringify({ quantity: item.quantity + 1 }) }); await loadCart(); })}>＋</button></div><b>{money(item.product.price * item.quantity)}</b><button className="remove" onClick={() => void run(async () => { await api(`/cart/items/${item.id}`, { method: 'DELETE' }); await loadCart(); })}>×</button></div>)}</div><aside className="panel summary"><h3>Tóm tắt đơn hàng</h3><div className="summary-line"><span>Tạm tính</span><b>{money(cart.total)}</b></div><div className="summary-line"><span>Giao hàng</span><span>Miễn phí</span></div><div className="summary-total"><span>Tổng cộng</span><b>{money(cart.total)}</b></div><button className="button button-dark full" onClick={() => setView('checkout')}>Tiến hành đặt hàng <span>→</span></button><button className="continue" onClick={() => setView('shop')}>← Tiếp tục chọn món</button></aside></div> : <div className="panel empty-cart"><span>🛍️</span><h2>Giỏ hàng đang trống</h2><p>Thêm vài món ngon để bắt đầu nhé.</p><button className="button button-dark" onClick={() => setView('shop')}>Xem menu</button></div>}</main>}
    {view === 'checkout' && <main className="content-page"><span className="eyebrow">BƯỚC CUỐI CÙNG</span><h1>Giao đến <em>bạn.</em></h1><div className="cart-layout"><form className="panel checkout-form" onSubmit={checkout}><h2>Thông tin nhận hàng</h2><label>Họ và tên<input name="name" required /></label><label>Số điện thoại<input name="phone" type="tel" required /></label><label>Địa chỉ giao hàng<textarea name="address" required rows={3}/></label><label>Ghi chú<textarea name="note" rows={2}/></label><label>Phương thức thanh toán<select name="payment"><option value="cash">Tiền mặt khi nhận hàng</option><option value="bank">Chuyển khoản</option></select></label><button disabled={busy} className="button button-dark full">Đặt hàng · {money(cart.total)}</button></form><aside className="panel summary"><h3>Đơn hàng của bạn</h3>{cart.items.map(i => <div className="summary-line" key={i.id}><span>{i.product.name} × {i.quantity}</span><b>{money(i.product.price * i.quantity)}</b></div>)}<div className="summary-total"><span>Tổng cộng</span><b>{money(cart.total)}</b></div></aside></div></main>}
    {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={() => setNotice('')}>×</button></div>}
    {selectedProduct && <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="detail-close" aria-label="??ng" onClick={() => setSelectedProduct(null)}>?</button>{selectedProduct.image && <img className="detail-image" src={imageUrl(selectedProduct.image)} alt={selectedProduct.name}/>}<div className="detail-copy"><span className="eyebrow">{selectedProduct.category?.name || 'M?n ngon'}</span><h2 id="detail-title">{selectedProduct.name}</h2><strong className="detail-price">{money(selectedProduct.price)}</strong><p>{selectedProduct.description || 'Pha m?i m?i ng?y, d?nh ri?ng cho b?n.'}</p><button disabled={busy || usingFallback} className="button button-dark" onClick={() => { setSelectedProduct(null); if (user) void add(selectedProduct.id); else setView('login'); }}>{usingFallback ? 'M?y ch? ?ang t?m ng?ng' : 'Th?m v?o gi? h?ng'}</button></div></section></div>}
    <footer><div className="footer-brand">drink<span>shop</span></div><p>Gửi một chút niềm vui đến bạn, mỗi ngày.</p><span>© 2026 Drink Shop · Made with care</span></footer>
  </div>;
}
