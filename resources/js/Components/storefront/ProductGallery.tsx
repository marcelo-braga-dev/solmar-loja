import {
    Box, IconButton, Stack, Modal, Fade, Backdrop, Typography, Chip,
    useMediaQuery, useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect, useRef, useCallback } from 'react';

export interface GalleryImage {
    url: string;
    alt?: string;
    is_cover?: boolean;
}

interface Props {
    images: GalleryImage[];
    productName: string;
    hasDiscount?: boolean;
    discountPercent?: number;
}

// ─── Painel de Zoom Externo ───────────────────────────────────────────────────
// Renderizado fora do container da imagem para não ficar limitado pelo tamanho

function ExternalZoomPanel({ src, zoomPos, mainW, mainH }: {
    src: string;
    zoomPos: { x: number; y: number } | null;
    mainW: number;
    mainH: number;
}) {
    const PANEL = 500;   // tamanho do painel de zoom
    const SCALE = 3.0;   // nível de ampliação

    if (!zoomPos) return null;

    // Calcula a posição do background para centralizar no ponto do cursor
    const bgX = -( (zoomPos.x / 100) * mainW * SCALE - PANEL / 2 );
    const bgY = -( (zoomPos.y / 100) * mainH * SCALE - PANEL / 2 );

    return (
        <Box
            sx={{
                position: 'absolute',
                left: 'calc(100% + 20px)',
                top: 0,
                width:  PANEL,
                height: PANEL,
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.09)',
                boxShadow: '0 16px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                zIndex: 20,
                bgcolor: '#F9FAFB',
                backgroundImage:    `url(${src})`,
                backgroundRepeat:   'no-repeat',
                backgroundSize:     `${mainW * SCALE}px ${mainH * SCALE}px`,
                backgroundPosition: `${bgX}px ${bgY}px`,
                animation: 'zoomFadeIn 0.15s ease',
                '@keyframes zoomFadeIn': {
                    from: { opacity: 0, transform: 'scale(0.97)' },
                    to:   { opacity: 1, transform: 'scale(1)' },
                },
                // Borda superior azul como indicador
                '&::before': {
                    content: '""',
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #0B5FFF, #4D8DFF)',
                    borderRadius: '16px 16px 0 0',
                },
                // Label de ampliação no canto inferior
                '&::after': {
                    content: '"' + SCALE + '×"',
                    position: 'absolute', bottom: 12, right: 14,
                    fontSize: 11, fontWeight: 800, color: 'rgba(0,0,0,0.25)',
                    letterSpacing: 0.5, fontFamily: 'monospace',
                },
                display: { xs: 'none', xl: 'block' },
            }}
        />
    );
}

// ─── Thumbnails ────────────────────────────────────────────────────────────────

function Thumbs({ images, active, onSelect, vertical }: {
    images: GalleryImage[];
    active:  number;
    onSelect: (i: number) => void;
    vertical: boolean;
}) {
    return (
        <Stack
            direction={vertical ? 'column' : 'row'}
            spacing={1.2}
            sx={{
                ...(vertical ? {
                    maxHeight: 520,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 0.5,
                    '&::-webkit-scrollbar': { width: 3 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.12)', borderRadius: 4 },
                } : {
                    overflowX: 'auto', pb: 0.5,
                    '&::-webkit-scrollbar': { height: 3 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.12)', borderRadius: 4 },
                }),
            }}
        >
            {images.map((img, i) => {
                const isActive = i === active;
                return (
                    <Box
                        key={i}
                        onClick={() => onSelect(i)}
                        sx={{
                            position: 'relative',
                            flexShrink: 0,
                            width:  vertical ? 82 : 76,
                            height: vertical ? 82 : 76,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: isActive ? '#0B5FFF' : 'transparent',
                            outline: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.09)',
                            outlineOffset: 0,
                            bgcolor: '#F8F9FA',
                            boxShadow: isActive
                                ? '0 0 0 3px rgba(11,95,255,0.18), 0 4px 16px rgba(11,95,255,0.12)'
                                : '0 1px 4px rgba(0,0,0,0.06)',
                            transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                            '&:hover': {
                                borderColor: isActive ? '#0B5FFF' : 'rgba(11,95,255,0.4)',
                                transform: 'scale(1.06)',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                                zIndex: 1,
                            },
                        }}
                    >
                        <Box
                            component="img"
                            src={img.url}
                            alt={img.alt ?? ''}
                            loading="lazy"
                            sx={{
                                width: '100%', height: '100%',
                                objectFit: 'contain',
                                p: '8px',
                                transition: 'transform 0.22s ease',
                                transform: isActive ? 'scale(1.07)' : 'scale(1)',
                            }}
                        />
                        {/* Overlay azul sutil no ativo */}
                        {isActive && (
                            <Box sx={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(135deg, rgba(11,95,255,0.06) 0%, transparent 60%)',
                                borderRadius: 'inherit',
                                pointerEvents: 'none',
                            }} />
                        )}
                    </Box>
                );
            })}
        </Stack>
    );
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose, onChange, productName }: {
    images: GalleryImage[];
    index: number;
    onClose: () => void;
    onChange: (i: number) => void;
    productName: string;
}) {
    const prev = () => onChange((index - 1 + images.length) % images.length);
    const next = () => onChange((index + 1) % images.length);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape')      onClose();
            if (e.key === 'ArrowLeft')  prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [index]);

    return (
        <Box sx={{ position: 'fixed', inset: 0, outline: 'none', display: 'flex', flexDirection: 'column' }}>
            {/* Barra superior */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, pt: 2.5, pb: 6,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
            }}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '100px', px: 2, py: 0.8,
                }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#4ADE80' }} />
                    <Typography sx={{ color: 'white', fontSize: 13, fontWeight: 600 }} noWrap>
                        {productName}
                    </Typography>
                    <Box sx={{ width: 1, height: 14, bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                        {index + 1} / {images.length}
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: 'white', bgcolor: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(12px)',
                        width: 44, height: 44,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', transform: 'scale(1.08)' },
                        transition: 'all 0.15s',
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Imagem */}
            <Box
                sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 7, md: 16 }, py: 10, position: 'relative' }}
                onClick={onClose}
            >
                <Box
                    component="img"
                    key={index}
                    src={images[index]?.url}
                    alt={images[index]?.alt ?? productName}
                    onClick={e => e.stopPropagation()}
                    sx={{
                        maxWidth: '100%', maxHeight: '76vh',
                        objectFit: 'contain', borderRadius: '20px',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)',
                        userSelect: 'none',
                        animation: 'lbIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                        '@keyframes lbIn': {
                            from: { opacity: 0, transform: 'scale(0.93) translateY(8px)' },
                            to:   { opacity: 1, transform: 'scale(1) translateY(0)' },
                        },
                    }}
                />

                {images.length > 1 && (
                    <>
                        {[
                            { dir: 'left',  pos: { left: { xs: 8, md: 24 } }, onClick: (e: React.MouseEvent) => { e.stopPropagation(); prev(); }, Icon: ChevronLeftIcon },
                            { dir: 'right', pos: { right: { xs: 8, md: 24 } }, onClick: (e: React.MouseEvent) => { e.stopPropagation(); next(); }, Icon: ChevronRightIcon },
                        ].map(({ dir, pos, onClick, Icon }) => (
                            <IconButton
                                key={dir}
                                onClick={onClick}
                                sx={{
                                    position: 'absolute', ...pos, top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'white',
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    backdropFilter: 'blur(16px)',
                                    width: 56, height: 56,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'translateY(-50%) scale(1.1)' },
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Icon sx={{ fontSize: 32 }} />
                            </IconButton>
                        ))}
                    </>
                )}
            </Box>

            {/* Strip inferior */}
            {images.length > 1 && (
                <Box sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                    display: 'flex', justifyContent: 'center', gap: 1,
                    px: 3, pt: 6, pb: 3,
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.72) 0%, transparent 100%)',
                    flexWrap: 'wrap',
                }}>
                    {images.map((img, i) => (
                        <Box
                            key={i}
                            onClick={() => onChange(i)}
                            sx={{
                                width: 58, height: 58, flexShrink: 0,
                                borderRadius: '10px', overflow: 'hidden',
                                border: '2px solid',
                                borderColor: i === index ? 'white' : 'rgba(255,255,255,0.22)',
                                opacity: i === index ? 1 : 0.5,
                                cursor: 'pointer',
                                bgcolor: '#0A0A0A',
                                transition: 'all 0.15s',
                                boxShadow: i === index ? '0 0 0 2px rgba(255,255,255,0.4)' : 'none',
                                '&:hover': { opacity: 1, borderColor: 'rgba(255,255,255,0.7)', transform: 'translateY(-3px) scale(1.05)' },
                            }}
                        >
                            <Box component="img" src={img.url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', p: '5px' }} />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

// ─── Main Gallery ──────────────────────────────────────────────────────────────

export default function ProductGallery({ images, productName, hasDiscount, discountPercent }: Props) {
    const theme   = useTheme();
    const isMd    = useMediaQuery(theme.breakpoints.up('md'));
    const isXl    = useMediaQuery(theme.breakpoints.up('xl'));

    const [active, setActive]           = useState(0);
    const [lightboxOpen, setLightbox]   = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const [zoomPos, setZoomPos]         = useState<{ x: number; y: number } | null>(null);
    const [fading, setFading]           = useState(false);
    const [containerRect, setContainerRect] = useState({ w: 480, h: 480 });
    const containerRef = useRef<HTMLDivElement>(null);

    const changeTo = useCallback((i: number) => {
        if (i === active) return;
        setFading(true);
        setTimeout(() => { setActive(i); setFading(false); }, 130);
    }, [active]);

    const openLightbox = (i: number) => { setLightboxIdx(i); setLightbox(true); };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isXl || !containerRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        setContainerRect({ w: r.width, h: r.height });
        setZoomPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    };

    if (images.length === 0) {
        return (
            <Box sx={{
                aspectRatio: '1/1', bgcolor: '#F3F4F6', borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(0,0,0,0.07)',
            }}>
                <Typography sx={{ color: 'rgba(0,0,0,0.3)', fontSize: 14 }}>Sem imagem disponível</Typography>
            </Box>
        );
    }

    const img = images[active];
    const showZoom = isXl && !!zoomPos;

    return (
        <>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 1.5, md: 2 }}
                sx={{ alignItems: 'flex-start', position: 'relative' }}
            >
                {/* Thumbnails verticais — desktop */}
                {images.length > 1 && isMd && (
                    <Box sx={{ flexShrink: 0 }}>
                        <Thumbs images={images} active={active} onSelect={changeTo} vertical />
                    </Box>
                )}

                {/* Imagem principal */}
                <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
                    <Box
                        ref={containerRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setZoomPos(null)}
                        onClick={() => !showZoom && openLightbox(active)}
                        sx={{
                            position: 'relative',
                            aspectRatio: '1/1',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            cursor: showZoom ? 'crosshair' : 'zoom-in',
                            userSelect: 'none',
                            bgcolor: '#000',
                            boxShadow: showZoom
                                ? '0 8px 40px rgba(11,95,255,0.12), 0 2px 12px rgba(0,0,0,0.12)'
                                : '0 2px 20px rgba(0,0,0,0.12)',
                            transition: 'box-shadow 0.25s ease',
                        }}
                    >
                        {/* Imagem com fade */}
                        <Box
                            component="img"
                            src={img.url}
                            alt={img.alt ?? productName}
                            sx={{
                                position: 'absolute', inset: 0,
                                width: '100%', height: '100%',
                                objectFit: 'contain',
                                opacity: fading ? 0 : 1,
                                transition: 'opacity 0.13s ease',
                                zIndex: 2,
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Badge desconto */}
                        {hasDiscount && !!discountPercent && discountPercent > 0 && (
                            <Box sx={{
                                position: 'absolute', top: 14, left: 14, zIndex: 5,
                                bgcolor: '#DC2626', color: 'white',
                                borderRadius: '8px', px: 1.3, py: 0.6,
                                fontSize: 12, fontWeight: 900, lineHeight: 1,
                                boxShadow: '0 2px 10px rgba(220,38,38,0.4)',
                                letterSpacing: '-0.3px',
                            }}>
                                -{discountPercent}%
                            </Box>
                        )}

                        {/* Topo direito: contador + expandir */}
                        <Box sx={{
                            position: 'absolute', top: 14, right: 14, zIndex: 5,
                            display: 'flex', alignItems: 'center', gap: 0.8,
                        }}>
                            {images.length > 1 && (
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.5,
                                    bgcolor: 'rgba(0,0,0,0.42)', color: 'white',
                                    borderRadius: '100px', px: 1.4, py: 0.5,
                                    fontSize: 11, fontWeight: 700,
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.14)',
                                    letterSpacing: '0.3px',
                                }}>
                                    {active + 1}/{images.length}
                                </Box>
                            )}
                            <Box
                                onClick={e => { e.stopPropagation(); openLightbox(active); }}
                                sx={{
                                    width: 32, height: 32,
                                    bgcolor: 'rgba(0,0,0,0.38)', color: 'white',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.14)',
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.65)', transform: 'scale(1.12)' },
                                    opacity: showZoom ? 0 : 1,
                                }}
                            >
                                <FullscreenIcon sx={{ fontSize: 16 }} />
                            </Box>
                        </Box>

                        {/* Hint inferior — só no desktop, só sem zoom */}
                        {!showZoom && (
                            <Box sx={{
                                position: 'absolute', bottom: 14, left: '50%',
                                transform: 'translateX(-50%)',
                                display: { xs: 'none', md: 'flex' },
                                alignItems: 'center', gap: 0.7,
                                bgcolor: 'rgba(0,0,0,0.38)', color: 'rgba(255,255,255,0.88)',
                                borderRadius: '100px', px: 1.8, py: 0.7,
                                fontSize: 11.5, fontWeight: 500,
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                whiteSpace: 'nowrap', zIndex: 5, pointerEvents: 'none',
                                letterSpacing: '0.1px',
                            }}>
                                <SearchIcon sx={{ fontSize: 13 }} />
                                {isXl ? 'Passe o mouse para ampliar · Clique para tela cheia' : 'Clique para tela cheia'}
                            </Box>
                        )}

                        {/* Hint de ampliação quando zoom ativo */}
                        {showZoom && (
                            <Box sx={{
                                position: 'absolute', bottom: 14, left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex', alignItems: 'center', gap: 0.7,
                                bgcolor: 'rgba(11,95,255,0.75)', color: 'white',
                                borderRadius: '100px', px: 1.8, py: 0.7,
                                fontSize: 11, fontWeight: 700,
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                whiteSpace: 'nowrap', zIndex: 5, pointerEvents: 'none',
                            }}>
                                3× ampliado →
                            </Box>
                        )}

                        {/* Setas prev/next */}
                        {images.length > 1 && (
                            <>
                                {[
                                    { side: 'left',  Icon: ChevronLeftIcon,  onClick: (e: React.MouseEvent) => { e.stopPropagation(); changeTo((active - 1 + images.length) % images.length); } },
                                    { side: 'right', Icon: ChevronRightIcon, onClick: (e: React.MouseEvent) => { e.stopPropagation(); changeTo((active + 1) % images.length); } },
                                ].map(({ side, Icon, onClick }) => (
                                    <Box
                                        key={side}
                                        onClick={onClick}
                                        sx={{
                                            position: 'absolute', top: '50%',
                                            [side]: 12,
                                            transform: 'translateY(-50%)',
                                            width: 38, height: 38,
                                            borderRadius: '50%',
                                            bgcolor: 'rgba(255,255,255,0.88)',
                                            color: 'rgba(0,0,0,0.7)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            opacity: showZoom ? 0 : 1,
                                            pointerEvents: showZoom ? 'none' : 'auto',
                                            transition: 'all 0.18s',
                                            zIndex: 5,
                                            '&:hover': {
                                                bgcolor: 'white',
                                                color: '#0B5FFF',
                                                transform: 'translateY(-50%) scale(1.12)',
                                                boxShadow: '0 4px 20px rgba(11,95,255,0.2)',
                                            },
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 22 }} />
                                    </Box>
                                ))}
                            </>
                        )}
                    </Box>

                    {/* Painel de zoom externo — posicionado relativamente ao container */}
                    {isXl && (
                        <ExternalZoomPanel
                            src={img.url}
                            zoomPos={zoomPos}
                            mainW={containerRect.w}
                            mainH={containerRect.h}
                        />
                    )}

                    {/* Dots de progresso */}
                    {images.length > 1 && images.length <= 10 && (
                        <Stack direction="row" spacing={0.8} sx={{ justifyContent: 'center', mt: 2.5 }}>
                            {images.map((_, i) => (
                                <Box
                                    key={i}
                                    onClick={() => changeTo(i)}
                                    sx={{
                                        height: 7, borderRadius: '100px',
                                        width: i === active ? 24 : 7,
                                        bgcolor: i === active ? '#0B5FFF' : 'rgba(0,0,0,0.14)',
                                        cursor: 'pointer',
                                        transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                                        '&:hover': { bgcolor: i === active ? '#0B5FFF' : 'rgba(0,0,0,0.28)' },
                                    }}
                                />
                            ))}
                        </Stack>
                    )}
                </Box>
            </Stack>

            {/* Thumbnails horizontais — mobile */}
            {images.length > 1 && !isMd && (
                <Box sx={{ mt: 2 }}>
                    <Thumbs images={images} active={active} onSelect={changeTo} vertical={false} />
                </Box>
            )}

            {/* Lightbox */}
            <Modal
                open={lightboxOpen}
                onClose={() => setLightbox(false)}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{ backdrop: { timeout: 250, sx: { bgcolor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)' } } }}
                sx={{ zIndex: 1500 }}
            >
                <Fade in={lightboxOpen} timeout={200}>
                    <Box sx={{ position: 'fixed', inset: 0, outline: 'none' }}>
                        <Lightbox
                            images={images}
                            index={lightboxIdx}
                            onClose={() => setLightbox(false)}
                            onChange={setLightboxIdx}
                            productName={productName}
                        />
                    </Box>
                </Fade>
            </Modal>
        </>
    );
}
