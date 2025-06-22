import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { ChannelView, ChannelRole } from '../constants/channel';

// ====================================================================================
// Context Definition
// ====================================================================================

interface ChannelFilterContextType {
    globalView: ChannelView;
    searchText: string;
    roleFilter: ChannelRole;
    setGlobalView: (view: ChannelView) => void;
    setSearchText: (text: string) => void;
    setRoleFilter: (role: ChannelRole) => void;
}

const ChannelFilterContext = createContext<ChannelFilterContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useChannelFilter = () => {
    const context = useContext(ChannelFilterContext);
    if (!context) {
        throw new Error('useChannelFilter must be used within a ChannelFilterProvider');
    }
    return context;
};

// ====================================================================================
// Provider Component
// ====================================================================================

interface ChannelFilterProviderProps {
    children: ReactNode;
}

export const ChannelFilterProvider = ({ children }: ChannelFilterProviderProps) => {
    const [globalView, setGlobalView] = useState<ChannelView>('all');
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<ChannelRole>('all');

    const value = useMemo(() => ({
        globalView,
        searchText,
        roleFilter,
        setGlobalView,
        setSearchText,
        setRoleFilter,
    }), [globalView, searchText, roleFilter]);

    return (
        <ChannelFilterContext.Provider value={value}>
            {children}
        </ChannelFilterContext.Provider>
    );
}; 