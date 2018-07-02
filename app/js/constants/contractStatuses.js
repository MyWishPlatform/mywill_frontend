var module = angular.module('Constants');
module.constant('CONTRACT_STATUSES_CONSTANTS', {
    'DRAFT': {
        title: 'Draft',
        value: 0
    },
    'CREATED': {
        title: 'Created',
        value: 1
    },
    'WAITING_FOR_PAYMENT': {
        title: 'Waiting for payment',
        value: 2
    },
    'WAITING_FOR_DEPLOYMENT': {
        title: 'Waiting for deployment',
        value: 3
    },
    'ACTIVE': {
        title: 'Active',
        value: 4
    },
    'EXPIRED': {
        title: 'Expired',
        value: 5
    },
    'CANCELLED': {
        title: 'Cancelled',
        value: 6
    },
    'KILLED': {
        title: 'Cancelled',
        value: 7
    },
    'POSTPONED': {
        title: 'Postponed',
        value: 8
    },
    'TRIGGERED': {
        title: 'Done',
        value: 9
    },
    'WAITING_ACTIVATION': {
        title: 'Not Activated',
        value: 10
    },
    'ENDED': {
        title: 'Done',
        value: 11
    },
    'UNDER_CROWDSALE': {
        title: 'Under Crowdsale',
        value: 12
    },
    'SENDING_TOKENS': {
        title: 'Sending',
        value: 101
    }
});
