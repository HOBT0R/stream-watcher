import { Typography } from '@mui/material';

export const highlightText = (text: string | undefined, query: string | undefined) => {
    if (!query || !text) {
        return text;
    }

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) =>
                regex.test(part) ? (
                    <Typography 
                        component="span" 
                        key={index} 
                        sx={{ 
                            backgroundColor: 'highlight.main', 
                            color: 'highlight.contrastText', 
                            fontWeight: 'bold' 
                        }}
                    >
                        {part}
                    </Typography>
                ) : (
                    part
                )
            )}
        </>
    );
}; 