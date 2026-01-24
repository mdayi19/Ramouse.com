module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./src'],
                    extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
                    alias: {
                        '@': './src',
                        '@/api': './src/api',
                        '@/components': './src/components',
                        '@/hooks': './src/hooks',
                        '@/store': './src/store',
                        '@/services': './src/services',
                        '@/utils': './src/utils',
                        '@/types': './src/types',
                        '@/config': './src/config',
                        '@/constants': './src/constants',
                        '@/schemas': './src/schemas',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
