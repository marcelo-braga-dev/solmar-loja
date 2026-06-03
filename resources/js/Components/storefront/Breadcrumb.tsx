import { Link } from '@inertiajs/react';
import { Breadcrumbs, Typography, Link as MuiLink } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface Crumb {
    name: string;
    slug?: string;
}

interface Props {
    crumbs: Crumb[];
}

export default function Breadcrumb({ crumbs }: Props) {
    return (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ my: 2 }}>
            <MuiLink
                component={Link}
                href="/"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
                <HomeIcon fontSize="small" />
                Início
            </MuiLink>

            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;

                if (isLast || !crumb.slug) {
                    return (
                        <Typography key={i} variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                            {crumb.name}
                        </Typography>
                    );
                }

                return (
                    <MuiLink
                        key={i}
                        component={Link}
                        href={`/categorias/${crumb.slug}`}
                        sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                    >
                        {crumb.name}
                    </MuiLink>
                );
            })}
        </Breadcrumbs>
    );
}
