'use client';

import {
    Tooltip as ChakraTooltip,
    Portal,
} from '@chakra-ui/react';
import * as React from 'react';

export interface TooltipProps extends React.ComponentProps<typeof ChakraTooltip.Root> {
    /** Texto o nodo que se muestra dentro del tooltip */
    content: React.ReactNode;
    /** Muestra o no la flecha */
    showArrow?: boolean;
    /** Desactiva la muestra del tooltip */
    disabled?: boolean;
    /** Props para personalizar el Box del contenido */
    contentProps?: React.ComponentProps<typeof ChakraTooltip.Content>;
    /** Coloca el tooltip en un portal (útil si hay overflow escondido) */
    portalled?: boolean;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
    function Tooltip(
        {
            content,
            children,
            showArrow = false,
            disabled = false,
            portalled = true,
            contentProps,
            ...rest
        },
        ref
    ) {
        if (disabled) return <>{children}</>;

        return (
            <ChakraTooltip.Root {...rest}>
                <ChakraTooltip.Trigger asChild>
                    {children}
                </ChakraTooltip.Trigger>
                <Portal disabled={!portalled}>
                    <ChakraTooltip.Content ref={ref} {...contentProps}>
                        {showArrow && <ChakraTooltip.Arrow />}
                        {content}
                    </ChakraTooltip.Content>
                </Portal>
            </ChakraTooltip.Root>
        );
    }
);
