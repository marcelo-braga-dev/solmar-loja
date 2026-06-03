import axiosLib from 'axios';

const axios = axiosLib.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export default axios;
