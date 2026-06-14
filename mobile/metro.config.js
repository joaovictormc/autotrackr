const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const sharedPkg = path.resolve(__dirname, '../packages/shared');

const config = getDefaultConfig(__dirname);

// Permite Metro ver o pacote shared fora do diretório mobile/
config.watchFolders = [...(config.watchFolders || []), sharedPkg];

// Resolve @autotrackr/shared para o src do pacote compartilhado
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@autotrackr/shared': path.join(sharedPkg, 'src'),
};

module.exports = withNativeWind(config, { input: './global.css' });
