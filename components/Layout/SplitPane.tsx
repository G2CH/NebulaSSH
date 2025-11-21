import React, { useEffect, useRef } from 'react';
import { SplitNode, Pane } from '../../types';
import { simpleCn } from '../../utils';
import { useSlot } from '../../contexts/SlotContext';

interface Props {
    node: SplitNode;
    panes: Record<string, Pane>;
    onResize?: (nodeId: string, sizes: number[]) => void;
}

export const SplitPane: React.FC<Props> = ({ node, panes, onResize }) => {
    const { registerSlot } = useSlot();
    const slotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (node.type === 'leaf' && node.paneId && slotRef.current) {
            registerSlot(node.paneId, slotRef.current);
            return () => registerSlot(node.paneId!, null);
        }
    }, [node, registerSlot]);

    if (node.type === 'leaf') {
        if (!node.paneId) return null;
        return (
            <div
                ref={slotRef}
                className="flex-1 min-w-0 min-h-0 relative border border-slate-200 dark:border-dark-border/50"
                data-pane-id={node.paneId}
            />
        );
    }

    if (node.type === 'split' && node.children) {
        const isHorizontal = node.direction === 'horizontal';

        return (
            <div className={simpleCn(
                "flex flex-1 min-w-0 min-h-0",
                isHorizontal ? "flex-row" : "flex-col"
            )}>
                {node.children.map((child, index) => (
                    <React.Fragment key={child.id}>
                        <div
                            className="flex min-w-0 min-h-0 relative"
                            style={{ flex: child.flex || 1 }}
                        >
                            <SplitPane
                                node={child}
                                panes={panes}
                                onResize={onResize}
                            />
                        </div>
                        {/* Divider - Simplified for MVP without drag resize */}
                        {index < node.children!.length - 1 && (
                            <div className={simpleCn(
                                "bg-slate-200 dark:bg-dark-border z-10",
                                isHorizontal ? "w-[1px] cursor-col-resize hover:bg-nebula-500" : "h-[1px] cursor-row-resize hover:bg-nebula-500"
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    }

    return null;
};
