import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'MENUITEMS.MENU.TEXT',
    isTitle: true,
    roles: ['staff', 'admin']
  },
  {
    id: 10,
    label: 'menu.order.label',
    icon: 'plus-circle',
    link: '/aqua/orders/manage',
    roles: ['staff', 'admin']
  },
  {
    id: 7,
    label: 'menu.calendar.label',
    icon: 'calendar',
    link: '/aqua/calendar/syncfusion',
    roles: ['staff', 'admin']
  },
  {
    id: 6,
    label: 'menu.orders.label',
    icon: 'archive',
    link: '/aqua/orders',
    roles: ['staff', 'admin']
  },
  {
    id: 16,
    label: 'menu.messaging.label',
    icon: 'message-square',
    link: '/aqua/messaging',
    roles: ['staff', 'admin']
  },
  {
    id: 5,
    label: 'menu.contacts.label',
    icon: 'users',
    link: '/aqua/contacts',
    roles: ['staff', 'admin']
  },  
  {
    id: 8,
    label: 'menu.gifts.label',
    icon: 'gift',
    link: '/aqua/gifts',
    roles: ['staff', 'admin']
  },
  {
    id: 9,
    label: 'menu.subscriptions.label',
    icon: 'refresh-cw',
    link: '/aqua/subscriptions',
    roles: ['staff', 'admin']
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
        link: '/aqua/resources/human',
        mobileLink: '/aqua/resources/mobile/human',
        parentId: 2
      },
      {
        id: 22,
        label: 'menu.resources.sub.device',
        link: '/aqua/resources/device',
        mobileLink: '/aqua/resources/mobile/device',
        parentId: 2
      },
      {
        id: 23,
        label: 'menu.resources.sub.location',
        link: '/aqua/resources/location',
        parentId: 2
      },
      {
        id: 25,
        label: 'menu.resources.sub.branch',
        link: '/aqua/resources/branch',
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
        link: '/aqua/catalog/service',
        parentId: 3
      },
      {
        id: 31,
        label: 'menu.catalog.sub.prod',
        link: '/aqua/catalog/product',
        parentId: 3
      }

    ]
  },
  {
    id: 4,
    label: 'menu.templates.label',
    icon: 'file-text',
    link: '/aqua/templates',
    roles: ['admin']
  },
  /*
  {
    id: 7,
    label: 'menu.calendar.label',
    icon: 'calendar',
    link: '/aqua/calendar/syncfusion',
    roles: ['admin'],
    subItems: [
      {
        id: 71,
        label: 'menu.calendar.sub.fullcalendar',
        link: '/aqua/calendar/fullcalendar',
        parentId: 7
      },
      {
        id: 72,
        label: 'menu.calendar.sub.syncfusion',
        link: '/aqua/calendar/syncfusion',
        parentId: 7
      }
    ]
  },*/
  
  
  {
    id: 11,
    label: 'menu.branch.label',
    icon: 'settings',
    link: '/aqua/branch',
    roles: ['admin']
  },
  {
    id: 12,
    label: 'menu.tasks.label',
    icon: 'briefcase',
    link: '/aqua/tasks',
    roles: ['admin'],
    subItems: [
      {
        id: 121,
        label: 'menu.tasks.sub.manage',
        link: '/aqua/tasks/manage',
        parentId: 12
      },
      {
        id: 122,
        label: 'menu.tasks.sub.dashboard',
        link: '/aqua/tasks/dashboard',
        parentId: 12
      }
    ]
  },
  {
    id: 17,
    label: 'menu.accounting.label',
    icon: 'book',
    link: '/aqua/accounting',
    roles: ['admin'],
    subItems: [
      {
        id: 171,
        label: 'menu.accounting.sub.transactions',
        link: '/aqua/accounting/transactions',
        parentId: 17
      },
      {
        id: 172,
        label: 'menu.accounting.sub.payments',
        link: '/aqua/orders/payments',
        parentId: 17
      }
    ]
  },
  {
    id: 13,
    label: 'menu.loyalty.label',
    icon: 'user-plus',
    link: '/aqua/loyalty',
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
        link: '/aqua/local/domo',
        parentId: 15
      },
      {
        id: 152,
        label: 'menu.local.sub.jobs',
        link: '/aqua/local/jobs',
        parentId: 15
      },
      {
        id: 153,
        label: 'menu.local.sub.dialogflow',
        link: '/aqua/local/dialogflow',
        parentId: 15
      },
      {
        id: 154,
        label: 'menu.local.sub.doorAccess',
        link: '/aqua/local/door-access',
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
        link: '/aqua/demo',
        parentId: 30
      }
    ]
  }
  /*,
  {
    id: 14,
    label: 'menu.demo.label',
    icon: 'home',
    link: '/aqua/demo',
  }*/
];
