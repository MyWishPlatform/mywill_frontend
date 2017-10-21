angular.module('Constants').constant('MENU_CONSTANTS', [
    {
        titleUserPar: 'email',
        icon: 'icon-account',
        route: 'main.profile',
        hideForUser: 'is_ghost'
    },{
        title: 'Settings',
        icon: 'icon-settings',
        route: 'main.settings',
        noactive: true,
        noshow: true
    }, {
        title: 'Create contract',
        icon: 'icon-create-contract',
        route: 'main.createcontract.types',
        parent: 'main.createcontract'
    }, {
        title: 'My contracts',
        icon: 'icon-contracts',
        route: 'main.contracts.list',
        parent: 'main.contracts'
    }, {
        title: 'External developers',
        icon: 'icon-framew',
        route: 'main.extdevs'
    }, {
        title: 'Messages',
        icon: 'icon-mail',
        route: 'main.messages',
        noactive: true
    }, {
        title: 'Address book',
        icon: 'icon-phone-call',
        route: 'main.contacts',
        noactive: true
    }, {
        title: 'FAQ',
        icon: 'icon-question',
        route: 'main.faq',
        noactive: true
    }, {
        title: 'Buy tokens',
        icon: 'icon-but-tokens',
        route: 'main.buytokens',
        noactive: true
    }, {
        title: 'Support',
        icon: 'icon-phone-call',
        static: true,
        url: 'support@mywillplatform.io',
        type: 'mail'
    }
    // , {
    //     title: 'Log out',
    //     icon: 'icon-log-out',
    //     route: 'exit',
    //     hideForUser: 'is_ghost'
    // }
]);
