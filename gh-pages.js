var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/HeinHuijskes/43Seconds.git', // Update to point to your repository  
        user: {
            name: 'Hein Huijskes', // update to use your name
            email: 'h.huyskes@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)