// Romanian translations
export default {
    // App
    appName: 'Manager Facturi',

    // Navigation
    nav: {
        dashboard: 'Panou Principal',
        reports: 'Rapoarte',
        invoices: 'Facturi',
        receipts: 'Chitanțe',
        clients: 'Clienți',
        settings: 'Setări',
        admin: 'Admin',
    },

    // Common actions
    actions: {
        save: 'Salvează',
        cancel: 'Anulează',
        delete: 'Șterge',
        edit: 'Editează',
        view: 'Vizualizează',
        create: 'Creează',
        add: 'Adaugă',
        remove: 'Elimină',
        search: 'Caută',
        filter: 'Filtrează',
        apply: 'Aplică',
        clear: 'Curăță',
        export: 'Exportă',
        exportExcel: 'Exportă Excel',
        print: 'Printează',
        download: 'Descarcă',
        duplicate: 'Duplică',
        close: 'Închide',
        confirm: 'Confirmă',
        back: 'Înapoi',
        next: 'Următorul',
    },

    // Dashboard
    dashboard: {
        title: 'Panou Principal',
        subtitle: 'Privire de ansamblu asupra afacerii tale',
        totalInvoices: 'Total Facturi',
        totalClients: 'Total Clienți',
        totalRevenue: 'Venituri Totale',
        pendingInvoices: 'Facturi în Așteptare',
        recentInvoices: 'Facturi Recente',
        quickActions: 'Acțiuni Rapide',
        newInvoice: 'Factură Nouă',
        newClient: 'Client Nou',
    },

    // Reports
    reports: {
        title: 'Rapoarte',
        subtitle: 'Statistici și analiză',
        revenueOverTime: 'Venituri în Timp',
        statusDistribution: 'Distribuție Status Facturi',
        topClients: 'Top Clienți',
        overview: 'Privire de Ansamblu',
        totalRevenue: 'Venituri Totale',
        outstanding: 'Sume Restante',
        overdue: 'Sume Întârziate',
        filters: 'Filtre',
        dateRange: 'Interval',
        allClients: 'Toți Clienții',
        startDate: 'De la',
        endDate: 'Până la',
        noCurrencyData: 'Nu există facturi cu această monedă',
    },

    // Invoices
    invoices: {
        title: 'Facturi',
        subtitle: 'Gestionează facturile tale',
        newInvoice: 'Factură Nouă',
        editInvoice: 'Editare Factură',
        invoiceNumber: 'Număr Factură',
        series: 'Serie',
        number: 'Număr',
        date: 'Data',
        issueDate: 'Data Emiterii',
        dueDate: 'Data Scadentă',
        client: 'Client',
        selectClient: 'Selectează un client',
        total: 'Total',
        subtotal: 'Subtotal',
        tax: 'TVA',
        taxRate: 'Cotă TVA',
        currency: 'Moneda',
        exchangeRate: 'Curs Valutar',
        bnrRate: 'Curs BNR',
        customRate: 'Curs Personalizat',
        status: 'Status',
        template: 'Șablon',
        notes: 'Observații',
        paymentMethod: 'Modalitate de Plată',
        paymentTerms: 'Termen de Plată',
        days: 'zile',

        // Status
        statusDraft: 'Ciornă',
        statusSent: 'Trimisă',
        statusPaid: 'Plătită',
        statusOverdue: 'Scadentă',
        statusCancelled: 'Anulată',

        // Items
        items: 'Produse/Servicii',
        addItem: 'Adaugă Produs/Serviciu',
        itemDescription: 'Denumire',
        itemUnit: 'U.M.',
        itemQuantity: 'Cantitate',
        itemPrice: 'Preț Unitar',
        itemTotal: 'Total',

        // Units
        unitHours: 'ore',
        unitPiece: 'buc',
        unitService: 'serv',
        unitDay: 'zi',

        // Preview & Export
        preview: 'Previzualizare',
        exportPdf: 'Exportă PDF',
        selectTemplate: 'Selectează Șablon',

        // Empty state
        emptyTitle: 'Nu există facturi',
        emptyDescription: 'Creează prima ta factură pentru a începe',

        // Confirmations
        deleteConfirm: 'Ești sigur că vrei să ștergi această factură?',
        deleteSuccess: 'Factura a fost ștearsă cu succes',
        saveSuccess: 'Factura a fost salvată cu succes',
        selectAll: 'Selectează toate',
        clearSelection: 'Golește selecția',
        selectAllInView: 'Selectează toate (filtrate)',
        clearSelectionInView: 'Golește selecția filtrată',
        selectAllFiltered: 'Selectează toate filtrate ({count})',
        selectInvoice: 'Selectează factura {number}',
        selectedCount: '{count} selectate',
        searchPlaceholder: 'Caută după număr factură sau client',
        filterStatusAll: 'Toate statusurile',
        clearFilters: 'Resetează filtrele',
        noFilteredResults: 'Nicio factură nu corespunde filtrelor',
        downloadZip: 'Descarcă ZIP',
        deleteSelected: 'Șterge selecția',
        deleteSelectedConfirm: 'Ștergi {count} factură/facturi selectate?',
        deleteSelectedSuccess: 'Au fost șterse {count} factură/facturi',
        deleteSelectedPartial: 'Nu s-au putut șterge {count} factură/facturi',
        bulkDeleteFailed: 'Ștergerea selecției a eșuat',
        bulkDownloadSuccess: 'ZIP descărcat pentru {count} factură/facturi',
        bulkDownloadFailed: 'Descărcarea selecției a eșuat',
    },

    // Receipts
    receipts: {
        title: 'Chitanțe',
        subtitle: 'Gestionează chitanțele de plată',
        receiptNumber: 'Număr Chitanță',
        invoiceNumber: 'Număr Factură',
        client: 'Client',
        issueDate: 'Data Emiterii',
        amount: 'Sumă',
        viewReceipt: 'Vezi Chitanța',
        generateReceipt: 'Generează Chitanță',
        emptyTitle: 'Nu există chitanțe',
        emptyDescription: 'Chitanțele sunt generate când facturile sunt marcate ca plătite',
        deleteConfirm: 'Ești sigur că vrei să ștergi această chitanță?',
        deleteSuccess: 'Chitanța a fost ștearsă cu succes',
        searchPlaceholder: 'Caută după număr chitanță, factură sau client',
        filterCurrencyAll: 'Toate monedele',
        clearFilters: 'Resetează filtrele',
        noFilteredResults: 'Nicio chitanță nu corespunde filtrelor',
        selectReceipt: 'Selectează chitanța {number}',
        selectedCount: '{count} selectate',
        selectAllInView: 'Selectează toate (filtrate)',
        clearSelectionInView: 'Golește selecția filtrată',
        selectAllFiltered: 'Selectează toate filtrate ({count})',
        downloadZip: 'Descarcă ZIP',
        deleteSelected: 'Șterge selecția',
        deleteSelectedConfirm: 'Ștergi {count} chitanță/chitanțe selectate?',
        deleteSelectedSuccess: 'Au fost șterse {count} chitanță/chitanțe',
        deleteSelectedPartial: 'Nu s-au putut șterge {count} chitanță/chitanțe',
        bulkDeleteFailed: 'Ștergerea selecției a eșuat',
        bulkDownloadSuccess: 'ZIP descărcat pentru {count} chitanță/chitanțe',
        bulkDownloadFailed: 'Descărcarea selecției a eșuat',
    },

    // Clients
    clients: {
        title: 'Clienți',
        subtitle: 'Gestionează clienții tăi',
        newClient: 'Client Nou',
        editClient: 'Editare Client',
        name: 'Nume',
        companyName: 'Denumire Firmă',
        cif: 'CIF/CUI',
        regNo: 'Nr. Reg. Com.',
        address: 'Adresa',
        city: 'Oraș',
        email: 'Email',
        phone: 'Telefon',
        country: 'Țara',
        notes: 'Observații',

        // Empty state
        emptyTitle: 'Nu există clienți',
        emptyDescription: 'Adaugă primul tău client pentru a începe',

        // Confirmations
        deleteConfirm: 'Ești sigur că vrei să ștergi acest client?',
        deleteSuccess: 'Clientul a fost șters cu succes',
        saveSuccess: 'Clientul a fost salvat cu succes',
    },

    // Settings
    settings: {
        title: 'Setări',
        subtitle: 'Configurează detaliile afacerii tale',

        // Company
        companyDetails: 'Detalii Firmă',
        companyName: 'Denumire Firmă',
        companyCif: 'CIF/CUI',
        companyRegNo: 'Nr. Reg. Com.',
        companyAddress: 'Adresa',
        companyCity: 'Oraș',
        companyCountry: 'Țara',
        companyEmail: 'Email',
        companyPhone: 'Telefon',

        // Bank details
        bankDetails: 'Detalii Bancare',
        bankAccount: 'Cont Bancar (IBAN)',
        bankSwift: 'SWIFT/BIC',
        bankName: 'Banca',

        // Invoice settings
        invoiceSettings: 'Setări Facturi',
        defaultCurrency: 'Moneda Implicită',
        secondaryCurrency: 'Moneda Secundară',
        defaultPaymentTerms: 'Termen de Plată Implicit (zile)',
        invoiceSeries: 'Serie Facturi',
        nextInvoiceNumber: 'Următorul Număr Factură',

        // App settings
        appSettings: 'Setări Aplicație',
        language: 'Limba',

        // Save
        saveSuccess: 'Setările au fost salvate cu succes',
    },

    // Invoice Templates
    templates: {
        modern: 'Modern',
        modernDesc: 'Design curat și minimalist',
        classic: 'Executiv',
        classicDesc: 'Stil de afaceri tradițional',
        classicBlue: 'Clasic Albastru',
        classicBlueDesc: 'Stil profesional albastru',
        creative: 'Creativ',
        creativeDesc: 'Colorat și modern',
    },

    // Invoice document
    invoice: {
        invoice: 'FACTURĂ',
        from: 'De la',
        to: 'Către',
        supplier: 'Furnizor',
        client: 'Client',
        invoiceNo: 'Factură Nr.',
        date: 'Data',
        dueDate: 'Data Scadentă',
        description: 'Denumire produs sau serviciu',
        unit: 'U.M.',
        quantity: 'Cant.',
        unitPrice: 'Preț Unitar',
        amount: 'Valoare',
        subtotal: 'Subtotal',
        tax: 'TVA',
        total: 'Total',
        totalDue: 'Total de Plată',
        bankDetails: 'Detalii Bancare',
        iban: 'IBAN',
        swift: 'SWIFT',
        bank: 'Banca',
        paymentTerms: 'Termen de Plată',
        signature: 'Semnătura',
        customerSignature: 'Semnătura de primire',
    },

    // Validation
    validation: {
        required: 'Acest câmp este obligatoriu',
        invalidEmail: 'Adresă de email invalidă',
        invalidNumber: 'Număr invalid',
        minLength: 'Minim {min} caractere necesare',
        maxLength: 'Maxim {max} caractere permise',
    },

    // General
    general: {
        loading: 'Se încarcă...',
        noResults: 'Nu s-au găsit rezultate',
        error: 'A apărut o eroare',
        success: 'Succes',
        warning: 'Atenție',
        info: 'Info',
        yes: 'Da',
        no: 'Nu',
        or: 'sau',
        and: 'și',
        all: 'Toate',
        none: 'Niciuna',
    },
};
