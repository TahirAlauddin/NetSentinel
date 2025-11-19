# LoadBalancer Setup for Bare Metal Kubernetes

## How MetalLB Works on Bare Metal

MetalLB provides LoadBalancer functionality for bare metal Kubernetes clusters. In L2 mode (which you're using):

1. **IP Assignment**: MetalLB assigns the IP address (23.176.128.35) to one of your nodes
2. **ARP Response**: That node responds to ARP requests for that IP address
3. **Traffic Routing**: Traffic to that IP goes to that node, then Kubernetes service routing distributes it to pods across ALL nodes
4. **Load Balancing**: Kubernetes automatically load balances requests to pods on different nodes

**Important**: You don't need a separate "external LoadBalancer" - MetalLB IS the load balancer. The node that gets the IP will handle incoming traffic and route it to pods.

## Current Configuration

- **LoadBalancer IP**: 23.176.128.35 (configured in `metallb-pool.yaml`)
- **Frontend Service**: LoadBalancer on port 80 → accessible at `http://23.176.128.35`
- **Backend Service**: LoadBalancer on port 8000 → accessible at `http://23.176.128.35:8000`


And update `configmap.yaml`:
```yaml
api-url: "http://23.176.128.35:8000/api/v1"
nextauth-url: "http://23.176.128.35"
```

## Deployment Steps

1. **Apply MetalLB configuration**:
   ```bash
   kubectl apply -f infrastructure/k8s/metallb-pool.yaml
   ```

2. **Verify MetalLB is running**:
   ```bash
   kubectl get pods -n metallb-system
   ```

3. **Apply services**:
   ```bash
   kubectl apply -f infrastructure/k8s/frontend.yaml
   kubectl apply -f infrastructure/k8s/backend.yaml
   ```

4. **Check LoadBalancer IP assignment**:
   ```bash
   kubectl get svc
   # Look for EXTERNAL-IP column - should show 23.176.128.35
   ```

5. **Verify which node has the IP**:
   ```bash
   # On any node, check ARP table
   arp -a | grep 23.176.128.35
   # Or check MetalLB logs
   kubectl logs -n metallb-system -l app=metallb
   ```

## Alternative: NodePort (If MetalLB Doesn't Work)

If you prefer not to use MetalLB or it's not working, you can use NodePort:

1. Change service type to `NodePort` in `frontend.yaml`:
   ```yaml
   type: NodePort
   ports:
     - port: 80
       targetPort: 3000
       nodePort: 30080  # Accessible on any node IP:30080
   ```

2. Access via any node IP:
   - `http://23.176.128.35:30080`
   - `http://23.176.128.36:30080`
   - `http://23.176.128.37:30080`
   - `http://23.176.128.38:30080`

All will route to the same frontend pods.

## Troubleshooting

### MetalLB not assigning IPs

1. Check MetalLB is installed:
   ```bash
   kubectl get pods -n metallb-system
   ```

2. Check IP pool:
   ```bash
   kubectl get ipaddresspool -n metallb-system
   ```

3. Check L2Advertisement:
   ```bash
   kubectl get l2advertisement -n metallb-system
   ```

4. Check service status:
   ```bash
   kubectl describe svc netsentinel-frontend
   ```

### IP not reachable

1. Ensure the IP is in the same subnet as your nodes
2. Check firewall rules allow traffic to that IP
3. Verify ARP is working: `arp -a | grep 23.176.128.35`

