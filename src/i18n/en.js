// English translations
export default {
    // App
    appName: 'Invoice Manager',

    // Navigation
    nav: {
        dashboard: 'Dashboard',
        reports: 'Reports',
        invoices: 'Invoices',
        receipts: 'Receipts',
        clients: 'Clients',
        settings: 'Settings',
        admin: 'Admin',
    },

    // Common actions
    actions: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        create: 'Create',
        add: 'Add',
        remove: 'Remove',
        search: 'Search',
        filter: 'Filter',
        apply: 'Apply',
        clear: 'Clear',
        export: 'Export',
        exportExcel: 'Export Excel',
        print: 'Print',
        download: 'Download',
        duplicate: 'Duplicate',
        close: 'Close',
        confirm: 'Confirm',
        back: 'Back',
        next: 'Next',
    },

    // Dashboard
    dashboard: {
        title: 'Dashboard',
        subtitle: 'Overview of your business',
        totalInvoices: 'Total Invoices',
        totalClients: 'Total Clients',
        totalRevenue: 'Total Revenue',
        pendingInvoices: 'Pending Invoices',
        recentInvoices: 'Recent Invoices',
        quickActions: 'Quick Actions',
        newInvoice: 'New Invoice',
        newClient: 'New Client',
    },

    // Reports
    reports: {
        title: 'Reports',
        subtitle: 'Statistics and analysis',
        revenueOverTime: 'Revenue Over Time',
        statusDistribution: 'Invoice Status Distribution',
        topClients: 'Top Clients',
        overview: 'Overview',
        totalRevenue: 'Total Revenue',
        outstanding: 'Outstanding Amount',
        overdue: 'Overdue Amount',
        filters: 'Filters',
        dateRange: 'Date Range',
        allClients: 'All Clients',
        startDate: 'Start Date',
        endDate: 'End Date',
        noCurrencyData: 'No invoices found with this currency',
    },

    // Invoices
    invoices: {
        title: 'Invoices',
        subtitle: 'Manage your invoices',
        newInvoice: 'New Invoice',
        editInvoice: 'Edit Invoice',
        invoiceNumber: 'Invoice Number',
        series: 'Series',
        number: 'Number',
        date: 'Date',
        issueDate: 'Issue Date',
        dueDate: 'Due Date',
        client: 'Client',
        selectClient: 'Select a client',
        total: 'Total',
        subtotal: 'Subtotal',
        tax: 'Tax',
        taxRate: 'Tax Rate',
        currency: 'Currency',
        exchangeRate: 'Exchange Rate',
        bnrRate: 'BNR Rate',
        customRate: 'Custom Rate',
        status: 'Status',
        template: 'Template',
        notes: 'Notes',
        paymentMethod: 'Payment Method',
        paymentTerms: 'Payment Terms',
        days: 'days',

        // Status
        statusDraft: 'Draft',
        statusSent: 'Sent',
        statusPaid: 'Paid',
        statusOverdue: 'Overdue',
        statusCancelled: 'Cancelled',

        // Items
        items: 'Items',
        addItem: 'Add Item',
        itemDescription: 'Description',
        itemUnit: 'Unit',
        itemQuantity: 'Quantity',
        itemPrice: 'Unit Price',
        itemTotal: 'Total',

        // Units
        unitHours: 'hrs',
        unitPiece: 'pcs',
        unitService: 'srv',
        unitDay: 'day',

        // Preview & Export
        preview: 'Preview',
        exportPdf: 'Export PDF',
        selectTemplate: 'Select Template',

        // Empty state
        emptyTitle: 'No invoices yet',
        emptyDescription: 'Create your first invoice to get started',

        // Confirmations
        deleteConfirm: 'Are you sure you want to delete this invoice?',
        deleteSuccess: 'Invoice deleted successfully',
        saveSuccess: 'Invoice saved successfully',
    },

    // Receipts
    receipts: {
        title: 'Receipts',
        subtitle: 'Manage your payment receipts',
        receiptNumber: 'Receipt Number',
        invoiceNumber: 'Invoice Number',
        client: 'Client',
        issueDate: 'Issue Date',
        amount: 'Amount',
        viewReceipt: 'View Receipt',
        generateReceipt: 'Generate Receipt',
        emptyTitle: 'No receipts yet',
        emptyDescription: 'Receipts are generated when invoices are marked as paid',
        deleteConfirm: 'Are you sure you want to delete this receipt?',
        deleteSuccess: 'Receipt deleted successfully',
    },

    // Clients
    clients: {
        title: 'Clients',
        subtitle: 'Manage your clients',
        newClient: 'New Client',
        editClient: 'Edit Client',
        name: 'Name',
        companyName: 'Company Name',
        cif: 'Tax ID (CIF/VAT)',
        regNo: 'Registration Number',
        address: 'Address',
        city: 'City',
        email: 'Email',
        phone: 'Phone',
        country: 'Country',
        notes: 'Notes',

        // Empty state
        emptyTitle: 'No clients yet',
        emptyDescription: 'Add your first client to get started',

        // Confirmations
        deleteConfirm: 'Are you sure you want to delete this client?',
        deleteSuccess: 'Client deleted successfully',
        saveSuccess: 'Client saved successfully',
    },

    // Settings
    settings: {
        title: 'Settings',
        subtitle: 'Configure your business details',

        // Company
        companyDetails: 'Company Details',
        companyName: 'Company Name',
        companyCif: 'Tax ID (CIF/VAT)',
        companyRegNo: 'Registration Number',
        companyAddress: 'Address',
        companyCity: 'City',
        companyCountry: 'Country',
        companyEmail: 'Email',
        companyPhone: 'Phone',

        // Bank details
        bankDetails: 'Bank Details',
        bankAccount: 'Bank Account (IBAN)',
        bankSwift: 'SWIFT/BIC',
        bankName: 'Bank Name',

        // Invoice settings
        invoiceSettings: 'Invoice Settings',
        defaultCurrency: 'Default Currency',
        secondaryCurrency: 'Secondary Currency',
        defaultPaymentTerms: 'Default Payment Terms (days)',
        invoiceSeries: 'Invoice Series',
        nextInvoiceNumber: 'Next Invoice Number',

        // App settings
        appSettings: 'Application Settings',
        language: 'Language',

        // Save
        saveSuccess: 'Settings saved successfully',
    },

    // Invoice Templates
    templates: {
        modern: 'Modern',
        modernDesc: 'Clean and minimal design',
        classic: 'Executive',
        classicDesc: 'Traditional business style',
        classicBlue: 'Classic Blue',
        classicBlueDesc: 'Blue professional style',
        creative: 'Creative',
        creativeDesc: 'Colorful and modern',
    },

    // Invoice document
    invoice: {
        invoice: 'INVOICE',
        from: 'From',
        to: 'To',
        supplier: 'Supplier',
        client: 'Client',
        invoiceNo: 'Invoice No.',
        date: 'Date',
        dueDate: 'Due Date',
        description: 'Description',
        unit: 'Unit',
        quantity: 'Qty',
        unitPrice: 'Unit Price',
        amount: 'Amount',
        subtotal: 'Subtotal',
        tax: 'Tax',
        total: 'Total',
        totalDue: 'Total Due',
        bankDetails: 'Bank Details',
        iban: 'IBAN',
        swift: 'SWIFT',
        bank: 'Bank',
        paymentTerms: 'Payment Terms',
        signature: 'Signature',
        customerSignature: 'Customer Signature',
    },

    // Validation
    validation: {
        required: 'This field is required',
        invalidEmail: 'Invalid email address',
        invalidNumber: 'Invalid number',
        minLength: 'Minimum {min} characters required',
        maxLength: 'Maximum {max} characters allowed',
    },

    // General
    general: {
        loading: 'Loading...',
        noResults: 'No results found',
        error: 'An error occurred',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
        yes: 'Yes',
        no: 'No',
        or: 'or',
        and: 'and',
        all: 'All',
        none: 'None',
    },
};
