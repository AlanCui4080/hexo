const pkg = require('../../package.json');

module.exports = function (hexo) {
    const logger = hexo.log
    const depsList = Object.keys(pkg.dependencies);

    function checkDep(name) {
        try {
            require.resolve(name);
            return true;
        } catch(e) {
            logger.error(`Package ${name} is not installed.`);
        }
        return false;
    }

    logger.info('Checking dependencies');

    const missingDeps = depsList.map(checkDep).some(installed => !installed);

    if (missingDeps) {
        logger.error('Please install the missing dependencies.');
        logger.error('You can enter suka-theme directory and run following commands:');
        logger.error('$ npm i --production');
        logger.error('$ yarn --production # If you prefer yarn.');
        process.exit(-1);
    }
}