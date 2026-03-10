
-- Admin can view all platillos
CREATE POLICY "Admins can view all platillos"
ON public.platillos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
