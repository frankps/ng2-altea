import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'MENUITEMS.MENU.TEXT',
    isTitle: true,
    roles: []
  },
  {
    id: 10,
    label: 'menu.order.label',
    icon: 'plus-circle',
    link: '/%branch%/orders/manage',
    roles: []
  },
  {
    id: 7,
    label: 'menu.calendar.label',
    icon: 'calendar',
    link: '/%branch%/calendar/syncfusion',
    roles: []
  },
  {
    id: 6,
    label: 'menu.orders.label',
    icon: 'archive',
    link: '/%branch%/orders',
    roles: []
  },
  {
    id: 16,
    label: 'menu.messaging.label',
    icon: 'message-square',
    link: '/%branch%/messaging',
    roles: []
  },
  {
    id: 5,
    label: 'menu.contacts.label',
    icon: 'users',
    link: '/%branch%/contacts',
    roles: []
  },  
  {
    id: 8,
    label: 'menu.gifts.label',
    icon: 'gift',
    link: '/%branch%/gifts',
    roles: ['staff', 'admin', 'posAdmin']
  },
  {
    id: 9,
    label: 'menu.subscriptions.label',
    icon: 'refresh-cw',
    link: '/%branch%/subscriptions',
    roles: ['staff', 'admin', 'posAdmin']
  },
  {
    id: 2,
    label: 'menu.resources.label',
    icon: 'globe',
    roles: ['admin'],
    subItems: [
      {
        id: 21,
        label: 'menu.resources.sub.human',
        link: '/%branch%/resources/human',
        mobileLink: '/%branch%/resources/mobile/human',
        parentId: 2
      },
      {
        id: 22,
        label: 'menu.resources.sub.device',
        link: '/%branch%/resources/device',
        mobileLink: '/%branch%/resources/mobile/device',
        parentId: 2
      },
      {
        id: 23,
        label: 'menu.resources.sub.location',
        link: '/%branch%/resources/location',
        parentId: 2
      },
      {
        id: 25,
        label: 'menu.resources.sub.branch',
        link: '/%branch%/resources/branch',
        parentId: 2
      }  
    ]
  },
  {
    id: 3,
    label: 'menu.catalog.label',
    icon: 'database',
    roles: ['admin'],
    subItems: [
      {
        id: 32,
        label: 'menu.catalog.sub.svc',
        link: '/%branch%/catalog/service',
        parentId: 3
      },
      {
        id: 31,
        label: 'menu.catalog.sub.prod',
        link: '/%branch%/catalog/product',
        parentId: 3
      }

    ]
  },
  {
    id: 4,
    label: 'menu.templates.label',
    icon: 'file-text',
    link: '/%branch%/templates',
    roles: ['admin']
  },
  /*
  {
    id: 7,
    label: 'menu.calendar.label',
    icon: 'calendar',
    link: '/%branch%/calendar/syncfusion',
    roles: ['admin'],
    subItems: [
      {
        id: 71,
        label: 'menu.calendar.sub.fullcalendar',
        link: '/%branch%/calendar/fullcalendar',
        parentId: 7
      },
      {
        id: 72,
        label: 'menu.calendar.sub.syncfusion',
        link: '/%branch%/calendar/syncfusion',
        parentId: 7
      }
    ]
  },*/
  
  
  {
    id: 11,
    label: 'menu.branch.label',
    icon: 'settings',
    link: '/%branch%/branch',
    roles: ['admin']
  },
  {
    id: 12,
    label: 'menu.tasks.label',
    icon: 'briefcase',
    link: '/%branch%/tasks',
    roles: ['admin'],
    subItems: [
      {
        id: 121,
        label: 'menu.tasks.sub.manage',
        link: '/%branch%/tasks/manage',
        parentId: 12
      },
      {
        id: 122,
        label: 'menu.tasks.sub.dashboard',
        link: '/%branch%/tasks/dashboard',
        parentId: 12
      }
    ]
  },
  {
    id: 17,
    label: 'menu.accounting.label',
    icon: 'book',
    link: '/%branch%/accounting',
    roles: ['admin', 'posAdmin'],
    subItems: [
      {
        id: 171,
        label: 'menu.accounting.sub.transactions',
        link: '/%branch%/accounting/transactions',
        roles: ['admin'],
        parentId: 17
      },
      {
        id: 172,
        label: 'menu.accounting.sub.payments',
        link: '/%branch%/orders/payments',
        roles: ['admin', 'posAdmin'],
        parentId: 17
      }
    ]
  },
  {
    id: 13,
    label: 'menu.loyalty.label',
    icon: 'user-plus',
    link: '/%branch%/loyalty',
    roles: ['admin']
  },
  {
    id: 15,
    label: 'menu.local.label',
    icon: 'share-2',
    roles: ['admin'],
    subItems: [
      {
        id: 151,
        label: 'menu.local.sub.domo',
        link: '/%branch%/local/domo',
        parentId: 15
      },
      {
        id: 152,
        label: 'menu.local.sub.jobs',
        link: '/%branch%/local/jobs',
        parentId: 15
      },
      {
        id: 153,
        label: 'menu.local.sub.dialogflow',
        link: '/%branch%/local/dialogflow',
        parentId: 15
      },
      {
        id: 154,
        label: 'menu.local.sub.doorAccess',
        link: '/%branch%/local/door-access',
        parentId: 15
      }

    ]
  },
  {
    id: 30,
    label: 'menu.platform.label',
    icon: 'map',
    link: '/platform/users',
    roles: ['admin'],
    subItems: [
      {
        id: 301,
        label: 'menu.platform.sub.users',
        link: '/platform/users',
        parentId: 30
      },
      {
        id: 302,
        label: 'menu.platform.sub.orderDebug',
        link: '/platform/order-debug',
        parentId: 30
      },
      {
        id: 303,
        label: 'menu.platform.sub.stripeEvents',
        link: '/platform/stripe-events',
        parentId: 30
      },
      {
        id: 304,
        label: 'menu.demo.label',
        link: '/%branch%/demo',
        parentId: 30
      }
    ]
  }
  /*,
  {
    id: 14,
    label: 'menu.demo.label',
    icon: 'home',
    link: '/%branch%/demo',
  }*/
];
