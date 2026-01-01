declare module 'react-gtm-module' {
    export interface TagManagerArgs {
        gtmId: string;
        events?: object;
        dataLayer?: object;
        dataLayerName?: string;
        auth?: string;
        preview?: string;
    }

    export interface DataLayerArgs {
        dataLayer: object;
        dataLayerName?: string;
    }

    const TagManager: {
        initialize: (args: TagManagerArgs) => void;
        dataLayer: (args: DataLayerArgs) => void;
    };

    export default TagManager;
}
