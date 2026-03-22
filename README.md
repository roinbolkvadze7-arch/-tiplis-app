# შესყიდვის აქტი — შპს ტიფლისი

## 🚀 GitHub Pages-ზე გაშვება

### ნაბიჯი 1: Supabase პროექტის შექმნა
1. გადადით [supabase.com](https://supabase.com) და შექმენით ახალი პროექტი
2. გადადით **SQL Editor**-ში და გაუშვით `supabase-schema.sql` ფაილი
3. დაიხსომეთ:
   - **Project URL** → `Settings > API > Project URL`  
   - **anon public key** → `Settings > API > anon public`

### ნაბიჯი 2: GitHub Repository-ს მომზადება
1. შექმენით ახალი GitHub repository
2. ატვირთეთ ეს ფაილები (`index.html`, `.github/`)
3. გადადით **Settings > Secrets and variables > Actions**
4. დაამატეთ 2 secret:
   - `SUPABASE_URL` = თქვენი Project URL
   - `SUPABASE_ANON_KEY` = თქვენი anon public key

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
tiplis-app/
├── index.html              ← მთავარი აპლიკაცია
├── supabase-schema.sql     ← ბაზის SQL სქემა
├── README.md               ← ეს ფაილი
└── .github/
    └── workflows/
        └── deploy.yml      ← GitHub Actions (CI/CD)
```

## 🗄️ Supabase ცხრილები

| ცხრილი | აღწერა |
|--------|--------|
| `users` | მყიდველები (სისტემის მომხმარებლები) |
| `sellers` | გამყიდველების ბაზა |
| `acts` | შესყიდვის აქტები (JSONB goods ველით) |
