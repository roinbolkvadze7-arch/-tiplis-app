# შესყიდვის აქტი — შპს ტიფლისი

## 🚀 GitHub Pages-ზე გაშვება

### ნაბიჯი 1: Supabase პროექტის შექმნა
1. გადადით [supabase.com](https://supabase.com) და შექმენით ახალი პროექტი
2. გადადით **SQL Editor**-ში და გაუშვით `supabase-schema.sql` ფაილი
3. დაიხსომეთ:
   - **Project URL** → `Settings > API > Project URL`  
   - **anon public key** → `Settings > API > anon public`

### ლოკალური ტესტი (ლეპტოპზე)
`config.js`-ში ჩასვით **anon public key** `YOUR_SUPABASE_ANON_KEY`-ის ნაცვლად (ან დატოვეთ placeholder და ჩასვით მხოლოდ ტესტისთვის). გაუშვით `npx serve .` იმ ფოლდერიდან სადაც პროექტია.

### ნაბიჯი 2: GitHub Repository-ს მომზადება
1. შექმენით ახალი GitHub repository (მაგ. [\-tiplis-app](https://github.com/roinbolkvadze7-arch/-tiplis-app))
2. ატვირთეთ ეს ფაილები (`index.html`, `.github/`)
3. გადადით **Settings > Secrets and variables > Actions**
4. დაამატეთ **ერთი** secret (საკმარისია):
   - `SUPABASE_ANON_KEY` = თქვენი **anon public** key (Project URL ჩაწერილია `config.js`-ში).  
   Push-ზე workflow ჩაამატებს გასაღებს **`config.js`**-ში.

### ⚠️ ორი სხვადასხვა საიტი GitHub Pages-ზე
რეპოს სახელი განსაზღვრავს მისამართს:
- რეპო **`roinbolkvadze7-arch/-tiplis-app`** → **`https://roinbolkvadze7-arch.github.io/-tiplis-app/`** (ტირე `tiplis`-ის წინ)
- რეპო **`tiplis-app`** (სხვა რეპო) → **`https://roinbolkvadze7-arch.github.io/tiplis-app/`**  

თუ კოდს **`/-tiplis-app`** რეპოში ატვირთავ, **ამ URL-ზე** გახსენი საიტი — `tiplis-app` მისამართი სხვა რეპოს შიგთავსია და Supabase იქ არ განახლდება.

### თუ `-tiplis-app` URL-ზე მაინც წითელია Supabase
1. **Settings → Environments → github-pages** → **Environment secrets** → დაამატე **`SUPABASE_ANON_KEY`** (იგივე მნიშვნელობა). ზოგჯერ workflow `environment: github-pages`-ით ამ გარემოს სეკრეტებს ელოდება.  
2. Actions → ბოლო run → **Inject Supabase anon key** — ლოგში: `Supabase anon injected into config.js, length: ...` (~200+).  
3. გახსენი `https://.../-tiplis-app/config.js` (ან DevTools → Network) — `YOUR_SUPABASE_ANON_KEY` **არ უნდა** დარჩეს.

### ნაბიჯი 3: GitHub Pages ჩართვა
1. გადადით **Settings > Pages**
2. Source: **GitHub Actions**
3. შეინახეთ

### ✅ დასრულება
Push-ის შემდეგ სიტი ავტომატურად გაიშვება:
`https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

---

## 📁 ფაილების სტრუქტურა

```
-tiplis-app/
├── index.html              ← გვერდის მარკაფი
├── app.js                  ← ლოგიკა + Supabase
├── config.js               ← URL + anon key (placeholder; CI იყრის key-ს)
├── styles.css              ← სტილები
├── supabase-schema.sql     ← ბაზის SQL
├── .nojekyll
└── .github/workflows/deploy.yml
```

## 🗄️ Supabase ცხრილები

| ცხრილი | აღწერა |
|--------|--------|
| `users` | მყიდველები (სისტემის მომხმარებლები) |
| `sellers` | გამყიდველების ბაზა |
| `acts` | შესყიდვის აქტები (JSONB goods ველით) |
