# CarMarketplace Development Guide

## Code Quality Standards

### TypeScript
- Use strict type checking
- Avoid `any` types - use proper interfaces
- Document complex types with JSDoc comments
- Export interfaces for reusability

### Component Structure
```typescript
/**
 * Component description
 * @param props - Component props
 */
export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
    // State
    const [state, setState] = useState();
    
    // Hooks
    useEffect(() => {}, []);
    
    // Handlers
    const handleClick = () => {};
    
    // Render
    return <div>...</div>;
};
```

### Error Handling
Always use standardized error handling:
```typescript
import { handleAPIError, logError } from '@/utils/errorHandling';

try {
    await api.call();
} catch (error) {
    logError(error, 'ComponentName.functionName');
    const message = handleAPIError(error);
    showToast(message, 'error');
}
```

### Performance
- Use `useMemo` for expensive computations
- Use `useCallback` for callback functions passed to children
- Use `React.memo` for components that render often with same props
- Implement debouncing for search/filter inputs
- Use lazy loading for images

### Accessibility
- Add ARIA labels to all interactive elements
- Ensure keyboard navigation works
- Maintain focus management
- Use semantic HTML
- Test with screen readers

### Naming Conventions
- Components: `PascalCase`
- Files: `PascalCase.tsx` for components
- Hooks: `useHookName`
- Utilities: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### File Organization
```
CarMarketplace/
├── MarketplaceParts/     # Reusable components
├── ListingParts/         # Detail page sections
├── CarMarketplacePage.tsx
├── RentCarPage.tsx
└── README.md
```

### Documentation
- Add JSDoc comments to all exported functions
- Document props interfaces
- Add inline comments for complex logic
- Update README when adding features

### Testing Checklist
Before committing:
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Responsive on mobile (375px, 768px, 1024px)
- [ ] Dark mode works
- [ ] Accessibility (keyboard nav, ARIA labels)
- [ ] Error states handled gracefully

## Common Patterns

### Fetching Data
```typescript
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await api.getData();
            setData(result);
        } catch (err) {
            setError(handleAPIError(err));
            logError(err, 'MyComponent.fetchData');
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
}, []);
```

### Form Validation
```typescript
import { validateField } from '@/utils/carValidation';

const handleSubmit = () => {
    const error = validateField('title', formData.title);
    if (error) {
        showToast(error, 'error');
        return;
    }
    // Submit form
};
```

## Performance Optimization

### Image Optimization
Always use the OptimizedImage component:
```typescript
import { OptimizedImage } from './MarketplaceParts/OptimizedImage';

<OptimizedImage 
    src={image}
    alt="Description"
    aspectRatio="aspect-video"
    priority={isAboveFold}
/>
```

### Debouncing Search
```typescript
import { useDebounce } from '@/hooks/usePerformance';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
    // Fetch with debouncedSearch
}, [debouncedSearch]);
```

## Git Workflow
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test thoroughly
4. Commit with clear message: `git commit -m "feat: add feature description"`
5. Push and create PR

## Deployment
1. Run build: `npm run build`
2. Check for errors
3. Test production build locally
4. Deploy to staging first
5. Test on staging
6. Deploy to production
